use chrono::{DateTime, Utc};

pub fn time_ago(timestamp: i64) -> String {
    let now: DateTime<Utc> = Utc::now();
    let datetime: DateTime<Utc> = DateTime::<Utc>::from(
        std::time::SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(timestamp as u64),
    );

    let duration = now - datetime;

    if duration.num_seconds() < 60 {
        format!(
            "{} second{} ago",
            duration.num_seconds(),
            if duration.num_seconds() != 1 { "s" } else { "" }
        )
    } else if duration.num_minutes() < 60 {
        format!(
            "{} minute{} ago",
            duration.num_minutes(),
            if duration.num_minutes() != 1 { "s" } else { "" }
        )
    } else if duration.num_hours() < 24 {
        format!(
            "{} hour{} ago",
            duration.num_hours(),
            if duration.num_hours() != 1 { "s" } else { "" }
        )
    } else if duration.num_days() < 30 {
        format!(
            "{} day{} ago",
            duration.num_days(),
            if duration.num_days() != 1 { "s" } else { "" }
        )
    } else if duration.num_days() < 365 {
        let months = (duration.num_days() as f64 / 30.4375).floor() as i64;
        format!("{} month{} ago", months, if months != 1 { "s" } else { "" })
    } else {
        let years = (duration.num_days() as f64 / 365.2425).floor() as i64;
        format!("{} year{} ago", years, if years != 1 { "s" } else { "" })
    }
}

pub fn format_link(url: &str) -> String {
    let mut hostname = url;

    if let Some(idx) = url.find("://") {
        hostname = &url[idx + 3..];
    }

    if let Some(idx) = hostname.find('/') {
        hostname = &hostname[..idx];
    }

    if hostname == "github.com" {
        if let Some(idx) = url.find('/') {
            let path_parts: Vec<_> = url[idx + 1..]
                .split('/')
                .filter(|part| !part.is_empty())
                .collect();
            if !path_parts.is_empty() && path_parts.len() >= 2 {
                return format!("github.com/{}", path_parts[1]);
            }
        }
        return "github.com".to_string();
    }

    hostname.to_string()
}

pub fn round_score(num: f64) -> f64 {
    (num * 10000.0).round() / 10000.0
}
