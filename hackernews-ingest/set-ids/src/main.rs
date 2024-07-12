#![feature(array_chunks)]
#![feature(iter_array_chunks)]
extern crate redis;
use redis::Commands;

fn main() -> Result<(), ureq::Error> {
    loop {
        let client =
            redis::Client::open("redis://10.255.232.11")
                .expect("client");
        let mut con = client.get_connection().expect("connection");

        let end: usize = ureq::get("https://hacker-news.firebaseio.com/v0/maxitem.json")
            .call()?
            .into_string()?
            .parse()
            .expect("Should be num");

        let last_final: usize = con.get("last_final").unwrap_or(0);

        println!("{}", end);

        (last_final..end)
            .into_iter()
            .array_chunks()
            .into_iter()
            .for_each(|chunk: [usize; 20]| {
                println!("Pushing Chunks {:?}", chunk);

                let _: () = redis::pipe()
                    .cmd("LPUSH")
                    .arg("tovisit")
                    .arg(&chunk)
                    .ignore()
                    .cmd("SET")
                    .arg("last_final")
                    .arg(chunk[19])
                    .ignore()
                    .query(&mut con)
                    .expect("return");
            });
    }
}
