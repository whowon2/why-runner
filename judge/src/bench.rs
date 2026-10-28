//! Thesis benchmarks (`bench/` at the repo root drives them). Not
//! correctness checks: every test here is `#[ignore]`d, reads its cases from
//! a JSON file named by `BENCH_CASES` and writes a CSV to `BENCH_OUT`. They
//! need the same sandboxed invocation as `grade_tests` (see judge/CLAUDE.md).

use crate::compare;
use crate::constraints;
use crate::models::{
    CompareMode, ConstraintKind, Language, Problem, ProblemConstraint, StructuralRuleType,
};
use crate::runner;
use serde::Deserialize;
use std::io::Write;
use std::time::Instant;

fn language(name: &str) -> Language {
    match name {
        "c" => Language::C,
        "cpp" => Language::Cpp,
        "java" => Language::Java,
        "python" => Language::Python,
        "portugol" => Language::Portugol,
        "rust" => Language::Rust,
        other => panic!("unknown language {other}"),
    }
}

fn cases<T: for<'de> Deserialize<'de>>() -> Vec<T> {
    let path = std::env::var("BENCH_CASES").expect("BENCH_CASES must name a JSON file");
    serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap()
}

fn out(header: &str) -> std::fs::File {
    let path = std::env::var("BENCH_OUT").expect("BENCH_OUT must name the CSV to write");
    let mut file = std::fs::File::create(path).unwrap();
    writeln!(file, "{header}").unwrap();
    file
}

fn csv_field(text: &str) -> String {
    format!("\"{}\"", text.replace('"', "\"\""))
}

fn reps() -> usize {
    std::env::var("BENCH_REPS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(5)
}

#[derive(Deserialize)]
struct Program {
    lang: String,
    kind: String,
    code: String,
    input: String,
    expected: String,
}

/// Compile (prepare) time, run time and peak RSS per language and program.
/// Repetition 0 is the cold run (first compile/JVM start in a fresh
/// container); the rest are warm.
#[tokio::test(flavor = "current_thread")]
#[ignore]
async fn lang_cost_bench() {
    let mut csv = out("lang,kind,rep,prepare_ms,run_ms,peak_kb,ok");
    for p in cases::<Program>() {
        for rep in 0..reps() {
            let started = Instant::now();
            let prepared = runner::prepare(&p.code, language(&p.lang))
                .await
                .unwrap_or_else(|e| {
                    panic!("{} {} failed to prepare: {}", p.lang, p.kind, e.stderr)
                });
            let prepare_ms = started.elapsed().as_secs_f64() * 1000.0;
            let result = runner::execute(&prepared, &p.input, 30.0).await;
            let ok = result.exit_code == 0 && result.stdout.trim() == p.expected.trim();
            writeln!(
                csv,
                "{},{},{},{:.1},{},{},{}",
                p.lang,
                p.kind,
                rep,
                prepare_ms,
                result.duration_ms,
                result.peak_memory_kb.unwrap_or(-1),
                ok
            )
            .unwrap();
            println!(
                "{} {} rep{} prepare={:.0}ms run={}ms ok={}",
                p.lang, p.kind, rep, prepare_ms, result.duration_ms, ok
            );
        }
    }
}

/// The same program run bare (compiled and run with the same commands
/// straight on the host/container, no box) vs through `runner::execute`
/// (fresh isolate box per run: init, stage files, run, read meta, cleanup).
/// Also times an empty box lifecycle (init + cleanup) on its own.
#[tokio::test(flavor = "current_thread")]
#[ignore]
async fn sandbox_overhead_bench() {
    let mut csv = out("lang,kind,rep,mode,ms");
    for rep in 0..reps() * 4 {
        let started = Instant::now();
        let b = crate::isolate::box_init().await.unwrap();
        crate::isolate::box_cleanup(b.id).await;
        writeln!(
            csv,
            "-,lifecycle,{rep},isolate,{:.2}",
            started.elapsed().as_secs_f64() * 1000.0
        )
        .unwrap();
    }
    for p in cases::<Program>() {
        let lang = language(&p.lang);
        let dir = tempfile::tempdir().unwrap();
        let (source, compile, run) = bare_commands(lang);
        std::fs::write(dir.path().join(source), &p.code).unwrap();
        std::fs::write(dir.path().join("stdin.txt"), stdin_for(lang, &p.input)).unwrap();
        if let Some(compile) = compile {
            let status = std::process::Command::new("sh")
                .env("PATH", "/usr/local/bin:/usr/bin:/bin")
                .args(["-c", &compile])
                .current_dir(dir.path())
                .status()
                .unwrap();
            assert!(status.success(), "bare compile failed for {}", p.lang);
        }
        let prepared = runner::prepare(&p.code, lang).await.ok().unwrap();
        for rep in 0..reps() {
            let started = Instant::now();
            let output = std::process::Command::new("sh")
                .env("PATH", "/usr/local/bin:/usr/bin:/bin")
                .args(["-c", &format!("{run} < stdin.txt")])
                .current_dir(dir.path())
                .output()
                .unwrap();
            let bare = started.elapsed().as_secs_f64() * 1000.0;
            assert_eq!(
                String::from_utf8_lossy(&output.stdout).trim(),
                p.expected.trim(),
                "bare {} output",
                p.lang
            );
            let started = Instant::now();
            let result = runner::execute(&prepared, &p.input, 30.0).await;
            let boxed = started.elapsed().as_secs_f64() * 1000.0;
            assert_eq!(
                result.stdout.trim(),
                p.expected.trim(),
                "isolate {} output",
                p.lang
            );
            writeln!(csv, "{},{},{rep},bare,{bare:.2}", p.lang, p.kind).unwrap();
            writeln!(csv, "{},{},{rep},isolate,{boxed:.2}", p.lang, p.kind).unwrap();
            println!(
                "{} {} bare={bare:.0}ms isolate={boxed:.0}ms",
                p.lang, p.kind
            );
        }
    }
}

/// Mirrors the commands in `runner::prepare` (source file, compile, run).
fn bare_commands(lang: Language) -> (&'static str, Option<String>, String) {
    let jvm = format!("export JAVA_TOOL_OPTIONS='{}';", runner::JVM_TOOL_OPTIONS);
    match lang {
        Language::C => (
            "solution.c",
            Some("gcc -o program solution.c".into()),
            "./program".into(),
        ),
        Language::Cpp => (
            "solution.cpp",
            Some("g++ -o program solution.cpp".into()),
            "./program".into(),
        ),
        Language::Rust => (
            "script.rs",
            Some("rustc script.rs -o program".into()),
            "./program".into(),
        ),
        Language::Java => (
            "Main.java",
            Some(format!("{jvm} javac Main.java")),
            format!("{jvm} java Main"),
        ),
        Language::Python => ("script.py", None, "python3 script.py".into()),
        Language::Portugol => (
            "script.por",
            None,
            format!("{jvm} java -jar /portugol/portugol-console.jar -no-wait script.por"),
        ),
    }
}

fn stdin_for(lang: Language, input: &str) -> String {
    if lang == Language::Portugol {
        input.split_whitespace().collect::<Vec<_>>().join("\n")
    } else {
        input.to_string()
    }
}

#[derive(Deserialize)]
struct VerdictCase {
    lang: String,
    expected: String,
    variant: String,
    code: String,
    inputs: Vec<String>,
    outputs: Vec<String>,
}

/// Grades each crafted program through the real `grade` path and records the
/// verdict the judge gave next to the one the program was written to get.
#[tokio::test(flavor = "current_thread")]
#[ignore]
async fn verdict_accuracy_bench() {
    let mut csv = out("lang,expected,variant,got,runtime_ms,memory_kb,error");
    for c in cases::<VerdictCase>() {
        let problem = Problem {
            inputs: c.inputs.clone(),
            outputs: c.outputs.clone(),
            time_limit_ms: 1000,
            compare_mode: CompareMode::Tokens,
            float_epsilon: 1e-6,
            checker_language: None,
            checker_code: None,
        };
        let (report, runtime_ms, memory_kb) =
            crate::grade(&c.code, language(&c.lang), &problem, false).await;
        let error = report
            .failure_details
            .as_ref()
            .and_then(|f| f.error.clone())
            .unwrap_or_default();
        let error: String = error
            .lines()
            .last()
            .unwrap_or_default()
            .chars()
            .take(120)
            .collect();
        writeln!(
            csv,
            "{},{},{},{:?},{},{},{}",
            c.lang,
            c.expected,
            c.variant,
            report.verdict,
            runtime_ms,
            memory_kb.unwrap_or(-1),
            csv_field(&error)
        )
        .unwrap();
        println!(
            "{} {}/{} -> {:?}",
            c.lang, c.expected, c.variant, report.verdict
        );
    }
}

#[derive(Deserialize)]
struct ConstraintCase {
    id: String,
    lang: String,
    rule_type: String,
    params: String,
    /// Whether the code truly breaks the rule (ground truth, by hand).
    violates: bool,
    category: String,
    code: String,
}

/// Runs the structural constraint checker over hand-labelled samples
/// (including rule tokens inside strings and comments).
#[test]
#[ignore]
fn constraint_accuracy_bench() {
    let mut csv = out("id,lang,rule_type,category,violates,flagged");
    for c in cases::<ConstraintCase>() {
        let rule_type = match c.rule_type.as_str() {
            "max_loop_nesting_depth" => StructuralRuleType::MaxLoopNestingDepth,
            "forbidden_construct" => StructuralRuleType::ForbiddenConstruct,
            "required_construct" => StructuralRuleType::RequiredConstruct,
            other => panic!("unknown rule {other}"),
        };
        let constraint = ProblemConstraint {
            kind: ConstraintKind::Structural,
            rule_type: Some(rule_type),
            rule_params: Some(c.params.clone()),
            description: None,
        };
        let flagged = constraints::check(&c.code, language(&c.lang), &[constraint]).is_some();
        writeln!(
            csv,
            "{},{},{},{},{},{}",
            c.id, c.lang, c.rule_type, c.category, c.violates, flagged
        )
        .unwrap();
    }
}

#[derive(Deserialize)]
struct OutputPair {
    id: String,
    source: String,
    actual: String,
    expected: String,
}

/// Re-grades stored (actual, expected) output pairs offline under every
/// built-in compare mode, with `compare::matches` itself.
#[test]
#[ignore]
fn compare_regrade_bench() {
    let epsilon: f64 = std::env::var("BENCH_EPSILON")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1e-6);
    let mut csv = out("id,source,exact,tokens,float");
    for p in cases::<OutputPair>() {
        let m = |mode| compare::matches(mode, epsilon, &p.actual, &p.expected);
        writeln!(
            csv,
            "{},{},{},{},{}",
            p.id,
            p.source,
            m(CompareMode::Exact),
            m(CompareMode::Tokens),
            m(CompareMode::Float)
        )
        .unwrap();
    }
}
