#[derive(Debug, Default, PartialEq)]
pub struct IsolateMeta {
    pub time_secs: Option<f64>,
    pub wall_time_secs: Option<f64>,
    pub max_rss_kb: Option<i64>,
    pub exit_code: Option<i32>,
    /// isolate's status code: "TO" (time limit exceeded), "SG" (killed by a
    /// signal), "RE" (nonzero exit), "XX" (internal isolate error). Absent
    /// entirely on a normal zero-exit run.
    pub status: Option<String>,
    pub message: Option<String>,
}

/// Parses isolate's `--meta=<file>` output: one `key:value` pair per line
/// (e.g. `time:0.012\nmax-rss:2384\nstatus:TO\n`). Unknown keys are ignored.
pub fn parse_meta(text: &str) -> IsolateMeta {
    let mut meta = IsolateMeta::default();
    for line in text.lines() {
        let Some((key, value)) = line.split_once(':') else {
            continue;
        };
        match key {
            "time" => meta.time_secs = value.parse().ok(),
            "time-wall" => meta.wall_time_secs = value.parse().ok(),
            "max-rss" => meta.max_rss_kb = value.parse().ok(),
            "exitcode" => meta.exit_code = value.parse().ok(),
            "status" => meta.status = Some(value.to_string()),
            "message" => meta.message = Some(value.to_string()),
            _ => {}
        }
    }
    meta
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_normal_successful_run() {
        let text = "time:0.004\ntime-wall:0.012\nmax-rss:2384\nexitcode:0\n";
        let meta = parse_meta(text);
        assert_eq!(meta.time_secs, Some(0.004));
        assert_eq!(meta.wall_time_secs, Some(0.012));
        assert_eq!(meta.max_rss_kb, Some(2384));
        assert_eq!(meta.exit_code, Some(0));
        assert_eq!(meta.status, None);
    }

    #[test]
    fn parses_a_timeout() {
        let text = "time:5.000\ntime-wall:5.012\nmax-rss:1024\nstatus:TO\nmessage:Time limit exceeded\n";
        let meta = parse_meta(text);
        assert_eq!(meta.status.as_deref(), Some("TO"));
        assert_eq!(meta.message.as_deref(), Some("Time limit exceeded"));
    }

    #[test]
    fn ignores_unknown_keys() {
        let text = "time:0.001\ncg-mem:512\ncsw-voluntary:3\nexitcode:0\n";
        let meta = parse_meta(text);
        assert_eq!(meta.time_secs, Some(0.001));
        assert_eq!(meta.exit_code, Some(0));
    }

    #[test]
    fn empty_text_gives_all_none() {
        assert_eq!(parse_meta(""), IsolateMeta::default());
    }
}
