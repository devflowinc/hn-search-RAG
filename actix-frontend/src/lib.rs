use actix_web::{get, web, App, HttpServer};
use handlers::search_handler;
use utoipa::OpenApi;
use utoipa_redoc::{Redoc, Servable};

pub mod handlers;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Trieve No JS HN Search Webserver API",
        description = "Trieve No JS HN Search OpenAPI Specification. This document describes routes available in the Trieve No JS HN Search API.", 
        contact(
            name = "Trieve Team",
            url = "https://trieve.ai",
            email = "developers@trieve.ai",
        ),
        license(
            name = "BSL",
            url = "https://github.com/devflowinc/trieve-hn-discovery/blob/main/LICENSE.txt",
        ),
        version = "0.0.0",
    ),
    servers(
        (url = "https://nojshn.trieve.ai",
        description = "Production server"),
        (url = "http://localhost:9000",
        description = "Local development server"),
    ),
    paths(
        handlers::search_handler::search,
    ),
    components(
        schemas(),
    ),
    tags(
        (name = "search", description = "Endpoint for processing search queries."),
    ),
)]
pub struct ApiDoc;

#[get("/openapi.json")]
pub async fn get_openapi_spec_handler() -> impl actix_web::Responder {
    web::Json(ApiDoc::openapi())
}

pub fn main() -> std::io::Result<()> {
    actix_web::rt::System::new().block_on(async move {
        HttpServer::new(|| {
            App::new()
                .service(Redoc::with_url("/redoc", ApiDoc::openapi()))
                .service(get_openapi_spec_handler)
                .service(search_handler::search)
        })
        .bind(("0.0.0.0", 9000))?
        .run()
        .await
    })?;

    Ok(())
}
