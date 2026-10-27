//! Built-in output comparison modes (`problem.compare_mode`). The `checker`
//! mode runs the author's program instead and is handled in `main.rs::grade`.

use crate::models::CompareMode;

/// Whether `actual` (the program's stdout) matches `expected` (the declared
/// output) under `mode`. `CompareMode::Checker` never reaches here.
pub fn matches(mode: CompareMode, epsilon: f64, actual: &str, expected: &str) -> bool {
    match mode {
        // Byte-identical to the pre-compare-modes judge, so problems migrated
        // to `exact` grade exactly as before.
        CompareMode::Exact | CompareMode::Checker => actual.trim() == expected.trim(),
        CompareMode::Tokens => actual.split_whitespace().eq(expected.split_whitespace()),
        CompareMode::Float => {
            let actual: Vec<&str> = actual.split_whitespace().collect();
            let expected: Vec<&str> = expected.split_whitespace().collect();
            actual.len() == expected.len()
                && actual
                    .iter()
                    .zip(&expected)
                    .all(|(a, e)| float_token_matches(a, e, epsilon))
        }
    }
}

/// Two numeric tokens match within an absolute-or-relative tolerance; any
/// other pair (words, `nan`, `inf`) must be equal as strings.
fn float_token_matches(actual: &str, expected: &str, epsilon: f64) -> bool {
    if actual == expected {
        return true;
    }
    match (parse_finite(actual), parse_finite(expected)) {
        (Some(a), Some(e)) => {
            let diff = (a - e).abs();
            diff <= epsilon || diff <= epsilon * e.abs()
        }
        _ => false,
    }
}

fn parse_finite(token: &str) -> Option<f64> {
    token.parse::<f64>().ok().filter(|v| v.is_finite())
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPS: f64 = 1e-6;

    #[test]
    fn exact_trims_ends_only() {
        assert!(matches(CompareMode::Exact, EPS, "1 2\n", "1 2"));
        assert!(!matches(CompareMode::Exact, EPS, "1  2", "1 2"));
        assert!(!matches(CompareMode::Exact, EPS, "1\n2", "1 2"));
    }

    #[test]
    fn tokens_ignores_spacing_and_line_breaks() {
        assert!(matches(CompareMode::Tokens, EPS, "1\n2 3\n\n", "1 2\n3"));
        assert!(matches(CompareMode::Tokens, EPS, "a\r\nb\r\n", "a\nb"));
        assert!(!matches(CompareMode::Tokens, EPS, "1 2", "1 2 3"));
        assert!(!matches(CompareMode::Tokens, EPS, "YES", "yes"));
        assert!(matches(CompareMode::Tokens, EPS, "", "  \n"));
    }

    #[test]
    fn float_within_tolerance() {
        assert!(matches(CompareMode::Float, EPS, "0.3333331", "0.333333"));
        assert!(matches(CompareMode::Float, EPS, "2.5000000001 x", "2.5 x"));
        assert!(matches(CompareMode::Float, EPS, "1e3", "1000.0"));
    }

    #[test]
    fn float_relative_tolerance_for_large_values() {
        assert!(matches(CompareMode::Float, EPS, "1000000.5", "1000000"));
        assert!(!matches(CompareMode::Float, EPS, "1000002", "1000000"));
    }

    #[test]
    fn float_outside_tolerance() {
        assert!(!matches(CompareMode::Float, EPS, "0.51", "0.5"));
        assert!(!matches(CompareMode::Float, EPS, "1 2", "1"));
    }

    #[test]
    fn float_compares_words_and_non_finite_as_strings() {
        assert!(!matches(CompareMode::Float, EPS, "yes 1.0", "YES 1.0"));
        assert!(matches(CompareMode::Float, EPS, "YES 1.0000001", "YES 1.0"));
        assert!(!matches(CompareMode::Float, EPS, "nan", "0"));
        assert!(matches(CompareMode::Float, EPS, "inf", "inf"));
    }
}
