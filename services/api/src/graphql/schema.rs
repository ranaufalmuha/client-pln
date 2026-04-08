use async_graphql::{EmptySubscription, Schema};
use sqlx::PgPool;

use super::mutation::MutationRoot;
use super::query::QueryRoot;

pub type AppSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

pub fn create_schema(pool: PgPool) -> AppSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(pool)
        .limit_depth(10) // Limit query nesting depth
        .limit_complexity(1000) // Limit field selection complexity
        .finish()
}
