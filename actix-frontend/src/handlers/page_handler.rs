use actix_web::{get, HttpResponse};
use minijinja::context;

use crate::Templates;

#[get("/")]
pub async fn homepage(templates: Templates<'_>) -> impl actix_web::Responder {
    let templ = templates.get_template("index.html").unwrap();
    let response_body = templ.render(context! {}).unwrap();
    HttpResponse::Ok().body(response_body)
}

#[get("/about")]
pub async fn about(templates: Templates<'_>) -> impl actix_web::Responder {
    let templ = templates.get_template("about.html").unwrap();
    let response_body = templ.render(context! {}).unwrap();
    HttpResponse::Ok().body(response_body)
}
