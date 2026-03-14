use async_graphql::{EmptySubscription, Schema};
use sqlx::PgPool;

use super::mutation::MutationRoot;
use super::query::QueryRoot;

pub type AppSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

pub fn create_schema(pool: PgPool) -> AppSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(pool)
        .finish()
}
