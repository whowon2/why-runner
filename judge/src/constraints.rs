//! Judge-side structural static analysis (task 3.1). Checks a submitted
//! source against a problem's `structural` constraints — the v1 fixed
//! catalog is `max_loop_nesting_depth`, `forbidden_construct` and
//! `required_construct` (see design.md Non-Goals: no free-form rule DSL).
//! Algorithm-requirement
//! constraints are *not* handled here: those go through the
//! `PENDING_CONSTRAINT_CLASSIFICATION` web-side AI pass (see main.rs).
//!
//! Known v1 limitation: analysis runs against raw source text, not a real
//! parse tree, so string/comment contents can produce false positives (e.g.
//! the word "goto" inside a string literal). Acceptable for a fixed, small
//! rule catalog per design.md; a real per-language parser is future work.

use crate::models::{ConstraintKind, Language, ProblemConstraint, StructuralRuleType};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct MaxLoopNestingDepthParams {
    #[serde(rename = "maxDepth")]
    max_depth: u32,
}

#[derive(Debug, Deserialize)]
struct ForbiddenConstructParams {
    constructs: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct RequiredConstructParams {
    constructs: Vec<String>,
}

/// Runs every `structural` constraint against `code` and returns the first
/// violation found (order matches `constraints`), or `None` if all pass.
/// Non-structural constraints (algorithm-requirement) are ignored here.
pub fn check(
    code: &str,
    language: Language,
    constraints: &[ProblemConstraint],
) -> Option<crate::models::ConstraintViolation> {
    for constraint in constraints {
        if constraint.kind != ConstraintKind::Structural {
            continue;
        }
        let Some(rule_type) = constraint.rule_type else {
            continue;
        };
        let violation = match rule_type {
            StructuralRuleType::MaxLoopNestingDepth => {
                check_max_loop_nesting_depth(code, language, constraint.rule_params.as_deref())
            }
            StructuralRuleType::ForbiddenConstruct => {
                check_forbidden_construct(code, constraint.rule_params.as_deref())
            }
            StructuralRuleType::RequiredConstruct => {
                check_required_construct(code, constraint.rule_params.as_deref())
            }
        };
        if violation.is_some() {
            return violation;
        }
    }
    None
}

fn check_forbidden_construct(
    code: &str,
    params: Option<&str>,
) -> Option<crate::models::ConstraintViolation> {
    let params: ForbiddenConstructParams = params.and_then(|p| serde_json::from_str(p).ok())?;

    for construct in &params.constructs {
        if contains_word(code, construct) {
            return Some(crate::models::ConstraintViolation {
                rule: "forbidden_construct".to_string(),
                message: format!("Uses forbidden construct: `{}`", construct),
            });
        }
    }
    None
}

fn check_required_construct(
    code: &str,
    params: Option<&str>,
) -> Option<crate::models::ConstraintViolation> {
    let params: RequiredConstructParams = params.and_then(|p| serde_json::from_str(p).ok())?;

    // All listed constructs must be present — the first missing one is
    // reported (mirrors forbidden_construct's "first match wins" ordering).
    for construct in &params.constructs {
        if !contains_word(code, construct) {
            return Some(crate::models::ConstraintViolation {
                rule: "required_construct".to_string(),
                message: format!("Missing required construct: `{}`", construct),
            });
        }
    }
    None
}

/// Word-boundary substring search (not a regex dependency): true if `needle`
/// appears in `haystack` and isn't immediately flanked by an
/// identifier-continuation character on either side.
fn contains_word(haystack: &str, needle: &str) -> bool {
    if needle.is_empty() {
        return false;
    }
    let bytes = haystack.as_bytes();
    let needle_bytes = needle.as_bytes();
    let is_ident = |b: u8| b.is_ascii_alphanumeric() || b == b'_';

    let mut start = 0;
    while let Some(pos) = haystack[start..].find(needle) {
        let idx = start + pos;
        let before_ok = idx == 0 || !is_ident(bytes[idx - 1]);
        let after_idx = idx + needle_bytes.len();
        let after_ok = after_idx >= bytes.len() || !is_ident(bytes[after_idx]);
        if before_ok && after_ok {
            return true;
        }
        start = idx + 1;
    }
    false
}

fn check_max_loop_nesting_depth(
    code: &str,
    language: Language,
    params: Option<&str>,
) -> Option<crate::models::ConstraintViolation> {
    let params: MaxLoopNestingDepthParams = params.and_then(|p| serde_json::from_str(p).ok())?;
    let observed = max_loop_nesting_depth(code, language);

    if observed > params.max_depth {
        Some(crate::models::ConstraintViolation {
            rule: "max_loop_nesting_depth".to_string(),
            message: format!(
                "Loop nesting depth {} exceeds the allowed maximum of {}",
                observed, params.max_depth
            ),
        })
    } else {
        None
    }
}

fn loop_keywords(language: Language) -> &'static [&'static str] {
    match language {
        Language::Python | Language::C | Language::Cpp | Language::Java | Language::Rust => {
            &["for", "while"]
        }
        // Portugol console syntax uses Portuguese loop keywords.
        Language::Portugol => &["para", "enquanto", "repita"],
    }
}

/// Returns the maximum number of loops simultaneously nested inside one
/// another, using indentation for Python and brace-depth for the
/// brace-delimited languages. See module docs for the raw-text-scan
/// limitation.
fn max_loop_nesting_depth(code: &str, language: Language) -> u32 {
    match language {
        Language::Python => max_loop_nesting_depth_by_indent(code, loop_keywords(language)),
        _ => max_loop_nesting_depth_by_braces(code, loop_keywords(language)),
    }
}

/// Brace-delimited languages (C/C++/Java/Rust/Portugol-with-braces): track a
/// stack of block kinds by scanning `{`/`}`. A `{` is attributed to a loop
/// block if a loop keyword appears between the previous block boundary and
/// this brace (a coarse heuristic, not a real parser).
fn max_loop_nesting_depth_by_braces(code: &str, keywords: &[&str]) -> u32 {
    let mut stack: Vec<bool> = Vec::new(); // true = loop block
    let mut current_loop_depth: u32 = 0;
    let mut max_depth: u32 = 0;
    let mut segment_start = 0usize;

    for (i, ch) in code.char_indices() {
        match ch {
            '{' => {
                let segment = &code[segment_start..i];
                let is_loop = keywords.iter().any(|kw| contains_word(segment, kw));
                stack.push(is_loop);
                if is_loop {
                    current_loop_depth += 1;
                    max_depth = max_depth.max(current_loop_depth);
                }
                segment_start = i + 1;
            }
            '}' => {
                if let Some(was_loop) = stack.pop() {
                    if was_loop {
                        current_loop_depth = current_loop_depth.saturating_sub(1);
                    }
                }
                segment_start = i + 1;
            }
            _ => {}
        }
    }

    max_depth
}

/// Python: no braces, so nesting is tracked via indentation width of lines
/// starting with a loop keyword.
fn max_loop_nesting_depth_by_indent(code: &str, keywords: &[&str]) -> u32 {
    let mut loop_indents: Vec<usize> = Vec::new();
    let mut max_depth: u32 = 0;

    for line in code.lines() {
        let trimmed = line.trim_start();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let indent = line.len() - trimmed.len();

        // Pop any loop whose body we've dedented out of.
        while let Some(&last_indent) = loop_indents.last() {
            if indent <= last_indent {
                loop_indents.pop();
            } else {
                break;
            }
        }

        let starts_loop = keywords
            .iter()
            .any(|kw| trimmed.starts_with(&format!("{} ", kw)) || trimmed == *kw);
        if starts_loop {
            loop_indents.push(indent);
            max_depth = max_depth.max(loop_indents.len() as u32);
        }
    }

    max_depth
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ConstraintKind;

    fn structural(rule_type: StructuralRuleType, params: &str) -> ProblemConstraint {
        ProblemConstraint {
            kind: ConstraintKind::Structural,
            rule_type: Some(rule_type),
            rule_params: Some(params.to_string()),
            description: None,
        }
    }

    #[test]
    fn max_loop_nesting_python_within_limit() {
        let code = "for i in range(10):\n    print(i)\n";
        assert_eq!(max_loop_nesting_depth(code, Language::Python), 1);
    }

    #[test]
    fn max_loop_nesting_python_nested() {
        let code = "for i in range(10):\n    for j in range(10):\n        print(i, j)\n";
        assert_eq!(max_loop_nesting_depth(code, Language::Python), 2);
    }

    #[test]
    fn max_loop_nesting_python_sequential_not_nested() {
        let code = "for i in range(10):\n    print(i)\nfor j in range(10):\n    print(j)\n";
        assert_eq!(max_loop_nesting_depth(code, Language::Python), 1);
    }

    #[test]
    fn max_loop_nesting_c_nested() {
        let code = "int main() {\n  for (int i=0;i<10;i++) {\n    while (1) {\n      break;\n    }\n  }\n  return 0;\n}\n";
        assert_eq!(max_loop_nesting_depth(code, Language::C), 2);
    }

    #[test]
    fn max_loop_nesting_c_not_nested() {
        let code = "int main() {\n  for (int i=0;i<10;i++) { sum += i; }\n  if (sum > 0) { sum--; }\n  return 0;\n}\n";
        assert_eq!(max_loop_nesting_depth(code, Language::C), 1);
    }

    #[test]
    fn check_reports_violation_when_over_limit() {
        let code = "for i in range(10):\n    for j in range(10):\n        pass\n";
        let constraints = vec![structural(
            StructuralRuleType::MaxLoopNestingDepth,
            r#"{"maxDepth":1}"#,
        )];
        let violation = check(code, Language::Python, &constraints);
        assert!(violation.is_some());
        assert_eq!(violation.unwrap().rule, "max_loop_nesting_depth");
    }

    #[test]
    fn check_passes_when_within_limit() {
        let code = "for i in range(10):\n    pass\n";
        let constraints = vec![structural(
            StructuralRuleType::MaxLoopNestingDepth,
            r#"{"maxDepth":1}"#,
        )];
        assert!(check(code, Language::Python, &constraints).is_none());
    }

    #[test]
    fn forbidden_construct_detects_whole_word_only() {
        let code = "int x = 1; goto_ok(); goto label;";
        let constraints = vec![structural(
            StructuralRuleType::ForbiddenConstruct,
            r#"{"constructs":["goto"]}"#,
        )];
        let violation = check(code, Language::C, &constraints);
        assert!(violation.is_some());
        assert_eq!(violation.unwrap().rule, "forbidden_construct");
    }

    #[test]
    fn forbidden_construct_no_false_positive_on_prefix() {
        let code = "int x = 1; goto_ok();";
        let constraints = vec![structural(
            StructuralRuleType::ForbiddenConstruct,
            r#"{"constructs":["goto"]}"#,
        )];
        assert!(check(code, Language::C, &constraints).is_none());
    }

    #[test]
    fn required_construct_reports_violation_when_missing() {
        let code = "int main() { printf(\"hi\"); }";
        let constraints = vec![structural(
            StructuralRuleType::RequiredConstruct,
            r#"{"constructs":["cout"]}"#,
        )];
        let violation = check(code, Language::Cpp, &constraints);
        assert!(violation.is_some());
        assert_eq!(violation.unwrap().rule, "required_construct");
    }

    #[test]
    fn required_construct_passes_when_present() {
        let code = "int main() { std::cout << \"hi\"; }";
        let constraints = vec![structural(
            StructuralRuleType::RequiredConstruct,
            r#"{"constructs":["cout"]}"#,
        )];
        assert!(check(code, Language::Cpp, &constraints).is_none());
    }

    #[test]
    fn forbidden_and_required_combine() {
        // "don't use printf, use cout" == one forbidden_construct row +
        // one required_construct row on the same lesson.
        let code = "int main() { printf(\"hi\"); }";
        let constraints = vec![
            structural(
                StructuralRuleType::ForbiddenConstruct,
                r#"{"constructs":["printf"]}"#,
            ),
            structural(
                StructuralRuleType::RequiredConstruct,
                r#"{"constructs":["cout"]}"#,
            ),
        ];
        let violation = check(code, Language::Cpp, &constraints);
        assert!(violation.is_some());
        assert_eq!(violation.unwrap().rule, "forbidden_construct");
    }
}
