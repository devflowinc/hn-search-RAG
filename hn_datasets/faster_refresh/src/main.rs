#![feature(array_chunks)]
#![feature(iter_array_chunks)]
extern crate redis;
use redis::Commands;

fn main() -> Result<(), ureq::Error> {
    loop {
        let client =
            redis::Client::open("redis://:thisredispasswordisverysecureandcomplex@127.0.0.1/")
                .expect("client");
        let mut con = client.get_connection().expect("connection");

        let end: usize = ureq::get("https://hacker-news.firebaseio.com/v0/maxitem.json")
            .call()?
            .into_string()?
            .parse()
            .expect("Should be num");

        let last_final: usize = con.get("last_final").expect("");

        println!("{}", end);

        (last_final..end)
            .into_iter()
            .array_chunks()
            .into_iter()
            .for_each(|chunk: [usize; 20]| {
                println!("Pushing Chunks {:?}", chunk);
                
                let _: () = redis::pipe()
                    .cmd("LPUSH")
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
