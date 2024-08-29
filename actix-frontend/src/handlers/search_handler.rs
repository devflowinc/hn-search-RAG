use super::page_handler::SearchQueryParams;
use actix_web::web;
use chrono::{NaiveDate, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use trieve_client::models::{
    self, ChunkMetadata, ConditionType, FieldCondition, HasIdCondition, HighlightOptions,
    MatchCondition, SortOrder,
};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ScoreChunkMetadata {
    pub chunk: ChunkMetadata,
    pub highlights: Option<Option<Vec<String>>>,
    pub score: f32,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SimplifiedSearchResponse {
    pub chunks: Vec<ScoreChunkMetadata>,
    pub total_pages: Option<i64>,
}

pub struct CleanedQueriesAndSearchFilters {
    pub cleaned_query: String,
    pub must_filters: Vec<ConditionType>,
    pub must_not_filters: Vec<ConditionType>,
}

#[derive(Clone, Default, Debug, PartialEq, Serialize, Deserialize)]
pub struct TypoOptions {
    pub correct_typos: Option<Option<bool>>,
}

#[derive(Clone, Default, Debug, PartialEq, Serialize, Deserialize)]
pub struct CustomSearchChunksReqPayload {
    /// Set content_only to true to only returning the chunk_html of the chunks. This is useful for when you want to reduce amount of data over the wire for latency improvement (typically 10-50ms). Default is false.
    #[serde(
        rename = "content_only",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub content_only: Option<Option<bool>>,
    #[serde(rename = "filters", default, skip_serializing_if = "Option::is_none")]
    pub filters: Option<Option<Box<models::ChunkFilter>>>,
    /// Get total page count for the query accounting for the applied filters. Defaults to false, but can be set to true when the latency penalty is acceptable (typically 50-200ms).
    #[serde(
        rename = "get_total_pages",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub get_total_pages: Option<Option<bool>>,
    #[serde(
        rename = "highlight_options",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub highlight_options: Option<Option<Box<models::HighlightOptions>>>,
    /// Page of chunks to fetch. Page is 1-indexed.
    #[serde(rename = "page", default, skip_serializing_if = "Option::is_none")]
    pub page: Option<Option<i64>>,
    /// Page size is the number of chunks to fetch. This can be used to fetch more than 10 chunks at a time.
    #[serde(rename = "page_size", default, skip_serializing_if = "Option::is_none")]
    pub page_size: Option<Option<i64>>,
    #[serde(rename = "query")]
    pub query: Box<models::QueryTypes>,
    /// If true, stop words (specified in server/src/stop-words.txt in the git repo) will be removed. Queries that are entirely stop words will be preserved.
    #[serde(
        rename = "remove_stop_words",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub remove_stop_words: Option<Option<bool>>,
    /// Set score_threshold to a float to filter out chunks with a score below the threshold for cosine distance metric For Manhattan Distance, Euclidean Distance, and Dot Product, it will filter out scores above the threshold distance This threshold applies before weight and bias modifications. If not specified, this defaults to no threshold A threshold of 0 will default to no threashold
    #[serde(
        rename = "score_threshold",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub score_threshold: Option<Option<f32>>,
    #[serde(rename = "search_type")]
    pub search_type: models::SearchMethod,
    /// Set slim_chunks to true to avoid returning the content and chunk_html of the chunks. This is useful for when you want to reduce amount of data over the wire for latency improvement (typically 10-50ms). Default is false.
    #[serde(
        rename = "slim_chunks",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub slim_chunks: Option<Option<bool>>,
    #[serde(
        rename = "sort_options",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub sort_options: Option<Option<Box<models::SortOptions>>>,
    pub typo_options: Option<TypoOptions>,
    /// If true, quoted and - prefixed words will be parsed from the queries and used as required and negated words respectively. Default is false.
    #[serde(
        rename = "use_quote_negated_terms",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub use_quote_negated_terms: Option<Option<bool>>,
    /// User ID is the id of the user who is making the request. This is used to track user interactions with the search results.
    #[serde(rename = "user_id", default, skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Option<String>>,
}

pub fn get_default_score_threshold(search_method: models::SearchMethod) -> f32 {
    match search_method {
        models::SearchMethod::Fulltext => 5.0,
        models::SearchMethod::Semantic => 0.5,
        models::SearchMethod::Hybrid => 0.01,
        models::SearchMethod::Bm25 => 5.0,
    }
}

pub fn parse_search_payload_params(query: String) -> CleanedQueriesAndSearchFilters {
    let mut cleaned_query = query.clone();
    let mut must_filters: Vec<ConditionType> = vec![];
    let mut must_not_filters: Vec<ConditionType> = vec![];

    // Process author filters
    let any_author_names_regex = Regex::new(r"by:[a-zA-Z0-9_.][\w.-]+").unwrap();
    let none_author_names_regex = Regex::new(r"by:-[\w.-]+").unwrap();
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
    let any_site_regex = Regex::new(r"site:[a-zA-Z0-9_.][\w.-]+").unwrap();
    let none_site_regex = Regex::new(r"site:-[\w.-]+").unwrap();
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
    let points_gt_regex = Regex::new(r"points>\d+").unwrap();
    let points_lt_regex = Regex::new(r"points<\d+").unwrap();
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

    let comment_count_gt_regex = Regex::new(r"comments>\d+").unwrap();
    let comment_count_lt_regex = Regex::new(r"comments<\d+").unwrap();
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

    let date_gt_regex = Regex::new(r"date>\d{2}-\d{2}-\d{4}").unwrap();
    let date_lt_regex = Regex::new(r"date<\d{2}-\d{2}-\d{4}").unwrap();
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
            field: "time_stamp".to_string(),
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

    let story_id_regex = Regex::new(r"story:\d+").unwrap();
    let story_id_match = story_id_regex.find(&query).map(|m| m.as_str());
    if let Some(story_id) = story_id_match {
        cleaned_query = cleaned_query.replace(story_id, "");
        let story_id = story_id.replace("story:", "");

        must_filters.push(ConditionType::HasIdCondition(Box::new(HasIdCondition {
            ids: None,
            tracking_ids: Some(Some(vec![story_id.to_string()])),
        })));
    }

    let type_regex = Regex::new(r"type:[\w.-]+").unwrap();
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
        cleaned_query: cleaned_query.trim().to_string(),
    }
}

pub async fn get_search_results(
    trieve_client: web::Data<reqwest::Client>,
    query_params: web::Query<SearchQueryParams>,
) -> Vec<ScoreChunkMetadata> {
    let dataset_id =
        std::env::var("TRIEVE_DATASET_ID").expect("TRIEVE_DATASET_ID env must be present");
    let trieve_api_url = std::env::var("TRIEVE_API_URL").expect("TRIEVE_API_URL must be set");
    let trieve_api_key = std::env::var("TRIEVE_API_KEY").expect("TRIEVE_API_KEY must be set");

    let mut parsed_query =
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
    let score_threshold = get_default_score_threshold(search_method);

    if let Some(post_type) = query_params.post_type.clone() {
        if post_type != "all" {
            parsed_query
                .must_filters
                .push(ConditionType::FieldCondition(Box::new(FieldCondition {
                    field: "tag_set".to_string(),
                    match_any: None,
                    match_all: Some(Some(vec![MatchCondition::String(post_type)])),
                    date_range: None,
                    geo_bounding_box: None,
                    geo_polygon: None,
                    geo_radius: None,
                    range: None,
                })));
        }
    }

    let search_req_payload = CustomSearchChunksReqPayload {
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
        page: Some(Some(query_params.page.unwrap_or(1))),
        page_size: Some(Some(query_params.page_size.unwrap_or(30))),
        query: Box::new(models::QueryTypes::String(parsed_query.cleaned_query)),
        remove_stop_words: None,
        score_threshold: Some(Some(score_threshold)),
        search_type: search_method,
        slim_chunks: None,
        sort_options: if !query_params.order_by.clone().unwrap_or_default().is_empty()
            && query_params.order_by.clone().unwrap_or_default() != "relevance"
        {
            query_params.order_by.clone().map(|order_by| {
                Some(Box::new(models::SortOptions {
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
                            prefetch_amount: None,
                        },
                    ))))),
                    tag_weights: None,
                    use_weights: None,
                }))
            })
        } else {
            None
        },
        typo_options: Some(TypoOptions {
            correct_typos: Some(Some(false)),
        }),
        use_quote_negated_terms: Some(Some(true)),
        user_id: None,
    };

    let mut header_map: reqwest::header::HeaderMap = reqwest::header::HeaderMap::new();
    header_map.insert(
        "Content-Type",
        reqwest::header::HeaderValue::from_static("application/json"),
    );
    header_map.insert(
        "Authorization",
        reqwest::header::HeaderValue::from_str(&trieve_api_key).unwrap(),
    );
    header_map.insert(
        "TR-Dataset",
        reqwest::header::HeaderValue::from_str(&dataset_id).unwrap(),
    );
    header_map.insert(
        "X-API-Version",
        reqwest::header::HeaderValue::from_static("V2"),
    );

    let search_req_resp = trieve_client
        .post(trieve_api_url + "/api/chunk/search")
        .headers(header_map)
        .body(serde_json::to_string(&search_req_payload).unwrap())
        .send()
        .await;

    match search_req_resp {
        Ok(resp) => {
            let resp_text = resp.text().await.unwrap();
            match serde_json::from_str::<SimplifiedSearchResponse>(&resp_text) {
                Ok(simple_search_resp) => simple_search_resp.chunks,
                e => {
                    println!("Error: {:?}", e);
                    vec![]
                }
            }
        }
        Err(e) => {
            println!("Error parsing search results: {:?}", e);
            vec![]
        }
    }
}
