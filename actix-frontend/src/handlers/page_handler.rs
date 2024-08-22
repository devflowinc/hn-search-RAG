use crate::{handlers::search_handler::get_search_results, Templates};
use actix_web::{get, web, HttpResponse};
use minijinja::context;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, ToSchema, Clone)]
pub struct SearchQueryParams {
    pub q: Option<String>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub order_by: Option<String>,
    pub search_type: Option<String>,
    pub post_type: Option<String>, // "all" | "story" | "show" | "job" | "poll"
}
/// Search Hacker News
///
/// Q query param is required for search and can include inline filters. Other query params are optional.
#[utoipa::path(
    get,
    path = "/search",
    tag = "search",
    responses(
        (status = 200, description = "HTML page with search results", body = String),
    ),
    params(
        ("q" = Option<String>, Query, description = "Search query with inline filters"),
        ("page" = Option<i64>, Query, description = "Page number"),
        ("page_size" = Option<i64>, Query, description = "Number of items per page"),
        ("order_by" = Option<String>, Query, description = "Order by field"),
        ("search_type" = Option<String>, Query, description = "`fulltext`, `semantic`, `hybrid`, or `keyword` for the search type")
    )
)]
#[get("/")]
pub async fn homepage(
    templates: Templates<'_>,
    trieve_client: web::Data<reqwest::Client>,
    query_params: web::Query<SearchQueryParams>,
) -> impl actix_web::Responder {
    let templ = templates.get_template("homepage.html").unwrap();
    let results =
        if query_params.q.is_some() && !query_params.q.clone().unwrap_or_default().is_empty() {
            get_search_results(trieve_client, query_params.clone()).await
        } else {
            vec![]
        };

    let response_body = if query_params.q.is_some() {
        templ
            .render(context! {
                results => results,
                query => query_params.q.clone().unwrap_or_default(),
            })
            .expect("Should always render")
    } else {
        templ.render(context! {}).expect("Should always render")
    };

    HttpResponse::Ok().body(response_body)
}

#[get("/about")]
pub async fn about(templates: Templates<'_>) -> impl actix_web::Responder {
    let templ = templates.get_template("about.html").unwrap();
    let response_body = templ.render(context! {}).unwrap();
    HttpResponse::Ok().body(response_body)
}

#[get("/help")]
pub async fn help(templates: Templates<'_>) -> impl actix_web::Responder {
    let templ = templates.get_template("help.html").unwrap();
    let response_body = templ.render(context! {}).unwrap();
    HttpResponse::Ok().body(response_body)
}
