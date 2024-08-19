use actix_web::{get, HttpResponse};
use utoipa::ToSchema;

#[derive(ToSchema)]
pub struct Foo {
    pub bar: String,
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
pub async fn search() -> impl actix_web::Responder {
    HttpResponse::Ok().body("search")
}
