use async_graphql::http::{GraphQLPlaygroundConfig, playground_source};
use async_graphql::{Response as GraphQLExecutionResponse, ServerError};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::extract::State;
use axum::http::{HeaderMap, Method, header};
use axum::{Router, response::Html, routing::post};
use tower_http::cors::CorsLayer;
use tower_http::compression::CompressionLayer;
use std::time::Duration;

use crate::auth::AuthUser;
use crate::auth::jwt::decode_token;
use crate::graphql::schema::AppSchema;

#[derive(Clone)]
struct AppState {
    schema: AppSchema,
    jwt_secret: String,
}

async fn graphql_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let mut request = req.into_inner();

    if let Some(value) = headers.get(header::AUTHORIZATION) {
        let raw_auth = match value.to_str() {
            Ok(v) => v.trim(),
            Err(_) => return unauthorized_response("Invalid authorization header encoding"),
        };

        if !raw_auth.is_empty() {
            let token = match raw_auth.strip_prefix("Bearer ") {
                Some(v) => v.trim(),
                None => return unauthorized_response("Invalid authorization header format"),
            };

            let claims = match decode_token(token, &state.jwt_secret) {
                Ok(claims) => claims,
                Err(_) => return unauthorized_response("Invalid or expired token"),
            };

            request = request.data(AuthUser {
                user_id: claims.sub,
            });
        }
    }

    state.schema.execute(request).await.into()
}

fn unauthorized_response(message: &str) -> GraphQLResponse {
    GraphQLExecutionResponse::from_errors(vec![ServerError::new(message, None)]).into()
}

async fn graphql_playground() -> Html<String> {
    Html(playground_source(GraphQLPlaygroundConfig::new("/graphql")))
}

pub fn create_router(schema: AppSchema) -> Router {
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    // Configure CORS with specific allowed origins for security and performance
    // Default origins for development
    let mut allowed_origins: Vec<axum::http::HeaderValue> = vec![
        "http://localhost:1420".parse().unwrap(),
        "http://127.0.0.1:1420".parse().unwrap(),
        "http://localhost:4000".parse().unwrap(),
    ];

    // Add production origins from environment variable (comma-separated)
    // Example: ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
    if let Ok(origins_env) = std::env::var("ALLOWED_ORIGINS") {
        for origin in origins_env.split(',') {
            let origin = origin.trim();
            if !origin.is_empty() {
                if let Ok(header_value) = origin.parse() {
                    allowed_origins.push(header_value);
                }
            }
        }
    }

    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE, header::ACCEPT])
        .max_age(Duration::from_secs(86400)); // Cache preflight for 24 hours

    let state = AppState { schema, jwt_secret };

    Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .with_state(state)
        .layer(cors)
        .layer(CompressionLayer::new())
}
