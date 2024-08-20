use std::{io, process::Command};

fn main() -> Result<(), io::Error> {
    let output = Command::new("npx")
        .arg("tailwindcss")
        .arg("-i")
        .arg("./static/in.css")
        .arg("-o")
        .arg("./static/output.css")
        .output()?;

    // Stream output
    println!("{}", String::from_utf8_lossy(&output.stdout));

    minijinja_embed::embed_templates!("src/templates");
    Ok(())
}
