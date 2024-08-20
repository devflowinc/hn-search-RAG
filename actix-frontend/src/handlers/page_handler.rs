use actix_web::{get, post, HttpResponse};
use minijinja::context;
use serde::Deserialize;

use crate::Templates;

#[get("/")]
pub async fn homepage(templates: Templates<'_>) -> impl actix_web::Responder {
    let templ = templates.get_template("homepage.html").unwrap();
    let response_body = templ.render(context! {}).unwrap();
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

#[derive(Deserialize, Debug)]
struct SearchFormData {
    pub query: String,
    pub post_type: String,
    pub sort_by: String,
    pub date_range: String,
    pub search_type: String,
}

#[post("/")]
pub async fn post(
    templates: Templates<'_>,
    form_data: actix_web::web::Form<SearchFormData>,
) -> impl actix_web::Responder {
    let templ = templates.get_template("homepage.html").unwrap();

    println!("Form data: {:?}", form_data);

    let response_body = templ
        .render(context! {
            query => form_data.query
        })
        .unwrap();
    HttpResponse::Ok().body(response_body)
}
