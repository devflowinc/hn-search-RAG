use crate::handlers::page_handler;
use actix_cors::Cors;
use actix_files::Files;
use actix_web::{
    get,
    middleware::{Compress, Logger},
    web::{self, Data},
    App, HttpServer,
};
use minijinja::Environment;
use reqwest::ClientBuilder;
use tracing_actix_web::TracingLogger;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer};
use utoipa::OpenApi;
use utoipa_redoc::{Redoc, Servable};

type Templates<'a> = Data<Environment<'a>>;

pub mod formatting;
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
        handlers::page_handler::homepage,
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
    dotenvy::dotenv().ok();

    let trieve_reqwest_client = ClientBuilder::new()
        .build()
        .expect("Failed to create reqwest client");

    tracing_subscriber::Registry::default()
        .with(
            tracing_subscriber::fmt::layer().with_filter(
                EnvFilter::from_default_env()
                    .add_directive(tracing_subscriber::filter::LevelFilter::INFO.into()),
            ),
        )
        .init();

    actix_web::rt::System::new().block_on(async move {
        HttpServer::new(move || {
            // Load templates
            let mut env = Environment::new();
            env.add_filter("time_ago", formatting::time_ago);
            env.add_filter("format_link", formatting::format_link);
            env.add_filter("round_score", formatting::round_score);
            minijinja_embed::load_templates!(&mut env);

            App::new()
                .app_data(web::Data::new(env))
                .wrap(TracingLogger::default())
                .wrap(Cors::permissive())
                .wrap(Compress::default())
                .wrap(Logger::new("%r %s %b %{Referer}i %{User-Agent}i %T"))
                .app_data(web::Data::new(trieve_reqwest_client.clone()))
                .service(Redoc::with_url("/redoc", ApiDoc::openapi()))
                .service(get_openapi_spec_handler)
                .service(page_handler::homepage)
                .service(page_handler::about)
                .service(page_handler::help)
                .service(Files::new("/static", "./static"))
        })
        .bind(("0.0.0.0", 9000))?
        .run()
        .await
    })?;

    Ok(())
}
