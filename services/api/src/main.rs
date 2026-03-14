mod auth;
mod bootstrap;
mod graphql;
mod models;
mod repositories;
mod router;

use bootstrap::ensure_schema;
use database::create_pool;
use graphql::schema::create_schema;
use router::create_router;
use tokio::time::{Duration, sleep};

async fn connect_with_retry(
    database_url: &str,
    retries: u8,
    retry_delay: Duration,
) -> Result<sqlx::PgPool, sqlx::Error> {
    let mut attempts = 0_u8;

    loop {
        match create_pool(database_url).await {
            Ok(pool) => return Ok(pool),
            Err(error) => {
                attempts += 1;
                if attempts > retries {
                    return Err(error);
                }

                eprintln!(
                    "Database connection failed (attempt {attempts}/{retries}): {error}. Retrying in {}s...",
                    retry_delay.as_secs()
                );

                sleep(retry_delay).await;
            }
        }
    }
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let api_host = std::env::var("API_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let api_port = match std::env::var("API_PORT") {
        Ok(raw) => match raw.parse::<u16>() {
            Ok(parsed) => parsed,
            Err(_) => {
                eprintln!("Invalid API_PORT value: {raw}");
                return;
            }
        },
        Err(_) => 4000,
    };

    let pool = match connect_with_retry(&db_url, 4, Duration::from_secs(3)).await {
        Ok(pool) => pool,
        Err(error) => {
            eprintln!();
            eprintln!("Unable to connect to PostgreSQL using DATABASE_URL={db_url}");
            eprintln!("Final error: {error}");
            eprintln!("Make sure PostgreSQL is running and credentials are correct.");
            return;
        }
    };

    if let Err(error) = ensure_schema(&pool).await {
        eprintln!("Failed to bootstrap database schema: {error}");
        return;
    }

    let schema = create_schema(pool);

    let app = create_router(schema);

    let bind_address = format!("{api_host}:{api_port}");
    let listener = tokio::net::TcpListener::bind(&bind_address)
        .await
        .unwrap_or_else(|_| panic!("Failed to bind {bind_address}"));

    let display_host = if api_host == "0.0.0.0" {
        "localhost".to_string()
    } else {
        api_host.clone()
    };
    println!("API running at http://{display_host}:{api_port}/graphql");

    axum::serve(listener, app)
        .await
        .expect("API server exited unexpectedly");
}
