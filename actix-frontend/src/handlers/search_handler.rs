use actix_web::{get, web, HttpResponse};
use trieve_client::apis::configuration::{ApiKey, Configuration};

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
        ("q" = String, Query, description = "Search query with inline filters"),
        ("page" = Option<i32>, Query, description = "Page number"),
        ("page_size" = Option<i32>, Query, description = "Number of items per page"),
        ("order_by" = Option<String>, Query, description = "Order by field"),
    )
)]
#[get("/search")]
pub async fn search(trieve_client: web::Data<reqwest::Client>) -> impl actix_web::Responder {
    let trieve_config = get_trieve_config(trieve_client.get_ref().clone());

    HttpResponse::Ok().body("search")
}
