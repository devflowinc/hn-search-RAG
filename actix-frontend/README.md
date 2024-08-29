## Local Dev Setup

### Setup ENV's

`cp .env.dist .env`

### Server

`cargo watch -x run`

Once it starts running, the initial logs will show you the address you can navigate to.
Ex.
```
2024-08-29T19:55:48.838270Z  INFO actix_server::builder: starting 8 workers
2024-08-29T19:55:48.838534Z  INFO actix_server::server: Actix runtime found; starting in Actix runtime
2024-08-29T19:55:48.838612Z  INFO actix_server::server: starting service: "actix-web-service-0.0.0.0:9000", workers: 8, listening on: 0.0.0.0:9000
```

In this case, you can navigate to http://localhost:9000/

### Tailwind

`npx tailwindcss -i ./static/in.css -o ./static/output.css --watch`