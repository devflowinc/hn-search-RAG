use actix_web::web;
use chrono::{NaiveDate, Utc};
use regex::Regex;
use trieve_client::{
    apis::{
        chunk_api::search_chunks,
        configuration::{ApiKey, Configuration},
    },
    models::{
        self, ConditionType, FieldCondition, HasIdCondition, HighlightOptions, MatchCondition,
        ScoreChunk, SearchChunksReqPayload, SearchResponseTypes, SortOrder,
    },
};

use super::page_handler::SearchQueryParams;

pub fn get_trieve_config(trieve_client: reqwest::Client) -> Configuration {
    let trieve_api_url = std::env::var("TRIEVE_API_URL").expect("TRIEVE_API_URL must be set");
    let trieve_api_key = std::env::var("TRIEVE_API_KEY").expect("TRIEVE_API_KEY must be set");

    Configuration {
        api_key: Some(ApiKey {
            prefix: None,
            key: trieve_api_key,
        }),
        base_path: trieve_api_url,
        // this is not a required field and will be automatically set by ..Default::default() which would initialize a new client in 100ms
        client: trieve_client,
        ..Default::default()
    }
}

pub struct CleanedQueriesAndSearchFilters {
    pub cleaned_query: String,
    pub must_filters: Vec<ConditionType>,
    pub must_not_filters: Vec<ConditionType>,
}

pub fn parse_search_payload_params(query: String) -> CleanedQueriesAndSearchFilters {
    let mut cleaned_query = query.clone();
    let mut must_filters: Vec<ConditionType> = vec![];
    let mut must_not_filters: Vec<ConditionType> = vec![];

    // Process author filters
    let any_author_names_regex = Regex::new(r"by:-[\w.-]+/g").unwrap();
    let none_author_names_regex = Regex::new(r"by:-[\w.-]+/g").unwrap();
    let any_author_matches = any_author_names_regex
        .find_iter(&query)
        .map(|m| m.as_str())
        .collect::<Vec<&str>>();
    let none_author_matches = none_author_names_regex
        .find_iter(&query)
        .map(|m| m.as_str())
        .collect::<Vec<&str>>();
    if !any_author_matches.is_empty() {
        must_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "tag_set".to_string(),
            match_any: Some(Some(
                any_author_matches
                    .iter()
                    .map(|author| {
                        cleaned_query = cleaned_query.replace(author, "");
                        let author = author.replace("by:", "");
                        MatchCondition::String(author.to_string())
                    })
                    .collect::<Vec<MatchCondition>>(),
            )),
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: None,
        })));
    }
    if !none_author_matches.is_empty() {
        must_not_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "tag_set".to_string(),
            match_any: Some(Some(
                none_author_matches
                    .iter()
                    .map(|author| {
                        cleaned_query = cleaned_query.replace(author, "");
                        let author = author.replace("by:-", "");
                        MatchCondition::String(author.to_string())
                    })
                    .collect::<Vec<MatchCondition>>(),
            )),
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: None,
        })));
    }

    // Process site filters
    let any_site_regex = Regex::new(r"site:[\w.-]+/g").unwrap();
    let none_site_regex = Regex::new(r"site:-[\w.-]+/g").unwrap();
    let any_site_matches = any_site_regex
        .find_iter(&query)
        .map(|m| m.as_str())
        .collect::<Vec<&str>>();
    let none_site_matches = none_site_regex
        .find_iter(&query)
        .map(|m| m.as_str())
        .collect::<Vec<&str>>();
    if !any_site_matches.is_empty() {
        must_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "tag_set".to_string(),
            match_any: Some(Some(
                any_site_matches
                    .iter()
                    .map(|site| {
                        cleaned_query = cleaned_query.replace(site, "");
                        let site = site.replace("site:", "");
                        MatchCondition::String(site.to_string())
                    })
                    .collect::<Vec<MatchCondition>>(),
            )),
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: None,
        })));
    }
    if !none_site_matches.is_empty() {
        must_not_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "tag_set".to_string(),
            match_any: Some(Some(
                none_site_matches
                    .iter()
                    .map(|site| {
                        cleaned_query = cleaned_query.replace(site, "");
                        let site = site.replace("site:-", "");
                        MatchCondition::String(site.to_string())
                    })
                    .collect::<Vec<MatchCondition>>(),
            )),
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: None,
        })));
    }

    // Process points filters
    let points_gt_regex = Regex::new(r"points>\d+/").unwrap();
    let points_lt_regex = Regex::new(r"points<\d+/").unwrap();
    let points_gt_match = points_gt_regex.find(&query).map(|m| {
        cleaned_query = cleaned_query.replace(m.as_str(), "");
        let m = m.as_str().replace("points>", "");
        m.as_str().parse::<i64>().ok()
    });
    let points_lt_match = points_lt_regex.find(&query).map(|m| {
        cleaned_query = cleaned_query.replace(m.as_str(), "");
        let m = m.as_str().replace("points<", "");
        m.as_str().parse::<i64>().ok()
    });
    if points_gt_match.is_some() || points_lt_match.is_some() {
        must_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "num_value".to_string(),
            match_any: None,
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: Some(Some(Box::new(models::Range {
                gt: points_gt_match.map(|m| {
                    m.map(|parsed_int| Box::new(models::RangeCondition::Integer(parsed_int)))
                }),
                lt: points_lt_match.map(|m| {
                    m.map(|parsed_int| Box::new(models::RangeCondition::Integer(parsed_int)))
                }),
                gte: None,
                lte: None,
            }))),
        })));
    };

    let comment_count_gt_regex = Regex::new(r"comments>\d+/g").unwrap();
    let comment_count_lt_regex = Regex::new(r"comments<\d+/g").unwrap();
    let comments_gt_match = comment_count_gt_regex.find(&query).map(|m| {
        cleaned_query = cleaned_query.replace(m.as_str(), "");
        let m = m.as_str().replace("comments>", "");
        m.as_str().parse::<i64>().ok()
    });
    let comments_lt_match = comment_count_lt_regex.find(&query).map(|m| {
        cleaned_query = cleaned_query.replace(m.as_str(), "");
        let m = m.as_str().replace("comments<", "");
        m.as_str().parse::<i64>().ok()
    });
    if comments_gt_match.is_some() || comments_lt_match.is_some() {
        must_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "metadata.descendants".to_string(),
            match_any: None,
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: Some(Some(Box::new(models::Range {
                gt: comments_gt_match.map(|m| {
                    m.map(|parsed_int| Box::new(models::RangeCondition::Integer(parsed_int)))
                }),
                lt: comments_lt_match.map(|m| {
                    m.map(|parsed_int| Box::new(models::RangeCondition::Integer(parsed_int)))
                }),
                gte: None,
                lte: None,
            }))),
        })));
    };

    let date_gt_regex = Regex::new(r"date>\d{2}-\d{2}-\d{4}/g").unwrap();
    let date_lt_regex = Regex::new(r"date<\d{2}-\d{2}-\d{4}/g").unwrap();
    let timestamp_lt_match = date_lt_regex
        .find(&query)
        .map(|m| {
            cleaned_query = cleaned_query.replace(m.as_str(), "");
            let m = m.as_str().replace("date<", "");
            let date_parts = m.as_str().split("-").collect::<Vec<&str>>();
            let (month, day, year) = (
                date_parts.first().map(|m| m.parse::<u32>().ok()),
                date_parts.get(1).map(|m| m.parse::<u32>().ok()),
                date_parts.get(2).map(|m| m.parse::<i32>().ok()),
            );

            match (month, day, year) {
                (Some(Some(month)), Some(Some(day)), Some(Some(year))) => {
                    NaiveDate::from_ymd_opt(year, month, day).map(|date| {
                        date.and_hms_milli_opt(0, 0, 0, 0)
                            .expect("0 offset always valid")
                            .and_local_timezone(Utc)
                            .unwrap()
                            .timestamp()
                    })
                }
                _ => None,
            }
        })
        .unwrap_or(None);
    let timestamp_gt_match = date_gt_regex
        .find(&query)
        .map(|m| {
            cleaned_query = cleaned_query.replace(m.as_str(), "");
            let m = m.as_str().replace("date>", "");
            let date_parts = m.as_str().split("-").collect::<Vec<&str>>();
            let (month, day, year) = (
                date_parts.first().map(|m| m.parse::<u32>().ok()),
                date_parts.get(1).map(|m| m.parse::<u32>().ok()),
                date_parts.get(2).map(|m| m.parse::<i32>().ok()),
            );

            match (month, day, year) {
                (Some(Some(month)), Some(Some(day)), Some(Some(year))) => {
                    NaiveDate::from_ymd_opt(year, month, day).map(|date| {
                        date.and_hms_milli_opt(0, 0, 0, 0)
                            .expect("0 offset always valid")
                            .and_local_timezone(Utc)
                            .unwrap()
                            .timestamp()
                    })
                }
                _ => None,
            }
        })
        .unwrap_or(None);
    if timestamp_lt_match.is_some() || timestamp_gt_match.is_some() {
        must_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "metadata.descendants".to_string(),
            match_any: None,
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: None,
            range: Some(Some(Box::new(models::Range {
                gt: Some(
                    timestamp_gt_match
                        .map(|parsed_int| Box::new(models::RangeCondition::Integer(parsed_int))),
                ),
                lt: Some(
                    timestamp_lt_match
                        .map(|parsed_int| Box::new(models::RangeCondition::Integer(parsed_int))),
                ),
                gte: None,
                lte: None,
            }))),
        })));
    }

    let story_id_regex = Regex::new(r"id:\d+/g").unwrap();
    let story_id_match = story_id_regex.find(&query).map(|m| m.as_str());
    if let Some(story_id) = story_id_match {
        cleaned_query = cleaned_query.replace(story_id, "");
        let story_id = story_id.replace("id:", "");

        must_filters.push(ConditionType::HasIdCondition(Box::new(HasIdCondition {
            ids: None,
            tracking_ids: Some(Some(vec![story_id.to_string()])),
        })));
    }

    let type_regex = Regex::new(r"type:[\w.-]+/g").unwrap();
    let type_match = type_regex.find(&query).map(|m| m.as_str());
    if let Some(story_type) = type_match {
        cleaned_query = cleaned_query.replace(story_type, "");
        let story_type = story_type.replace("type:", "");

        must_filters.push(ConditionType::FieldCondition(Box::new(FieldCondition {
            field: "tag_set".to_string(),
            match_any: None,
            date_range: None,
            geo_bounding_box: None,
            geo_polygon: None,
            geo_radius: None,
            match_all: Some(Some(vec![MatchCondition::String(story_type.to_string())])),
            range: None,
        })));
    }

    CleanedQueriesAndSearchFilters {
        must_filters,
        must_not_filters,
        cleaned_query,
    }
}

pub async fn get_search_results(
    trieve_client: web::Data<reqwest::Client>,
    query_params: web::Query<SearchQueryParams>,
) -> Vec<ScoreChunk> {
    let dataset_id =
        std::env::var("TRIEVE_DATASET_ID").expect("TRIEVE_DATASET_ID env must be present");
    let trieve_config = get_trieve_config(trieve_client.get_ref().clone());
    let parsed_query =
        parse_search_payload_params(query_params.q.clone().unwrap_or("hackernews".to_string()));
    let search_method = match query_params.search_type.clone() {
        Some(search_type) => match search_type.as_str() {
            "fulltext" => models::SearchMethod::Fulltext,
            "semantic" => models::SearchMethod::Semantic,
            "hybrid" => models::SearchMethod::Hybrid,
            "keyword" => models::SearchMethod::Bm25,
            _ => models::SearchMethod::Fulltext,
        },
        _ => models::SearchMethod::Fulltext,
    };

    let search_results = search_chunks(
        &trieve_config,
        &dataset_id,
        SearchChunksReqPayload {
            content_only: None,
            filters: Some(Some(Box::new(models::ChunkFilter {
                must: Some(Some(parsed_query.must_filters)),
                must_not: Some(Some(parsed_query.must_not_filters)),
                jsonb_prefilter: Some(Some(false)),
                should: None,
            }))),
            get_total_pages: None,
            highlight_options: Some(Some(Box::new(HighlightOptions {
                highlight_results: Some(Some(true)),
                highlight_strategy: Some(Some(models::HighlightStrategy::Exactmatch)),
                highlight_delimiters: Some(Some(vec![
                    " ".to_string(),
                    "-".to_string(),
                    "_".to_string(),
                    ".".to_string(),
                    ",".to_string(),
                ])),
                highlight_threshold: Some(Some(0.85)),
                highlight_max_num: Some(Some(50)),
                highlight_window: Some(Some(0)),
                highlight_max_length: Some(Some(50)),
            }))),
            page: Some(Some(query_params.page.unwrap_or(30))),
            page_size: Some(Some(query_params.page_size.unwrap_or(30))),
            query: Box::new(models::QueryTypes::String(parsed_query.cleaned_query)),
            remove_stop_words: None,
            score_threshold: None,
            search_type: search_method,
            slim_chunks: None,
            sort_options: match query_params.order_by.clone() {
                Some(order_by) => Some(Some(Box::new(models::SortOptions {
                    location_bias: None,
                    sort_by: Some(Some(Box::new(models::QdrantSortBy::SortByField(Box::new(
                        models::SortByField {
                            field: match order_by.as_str() {
                                "points" => "num_value".to_string(),
                                "comments" => "metadata.descendants".to_string(),
                                "date" => "time_stamp".to_string(),
                                _ => "num_value".to_string(),
                            },
                            direction: Some(Some(SortOrder::Desc)),
                            prefetch_amount: Some(Some(query_params.page_size.unwrap_or(30))),
                        },
                    ))))),
                    tag_weights: None,
                    use_weights: None,
                }))),
                _ => None,
            },
            use_quote_negated_terms: Some(Some(true)),
            user_id: None,
        },
        Some(models::ApiVersion::V2),
    )
    .await;

    match search_results {
        Ok(search_result_type) => match search_result_type {
            SearchResponseTypes::SearchResponseBody(resp_body) => resp_body.chunks,
            _ => vec![],
        },
        Err(e) => {
            println!("Error: {:?}", e);
            vec![]
        }
    }
}
