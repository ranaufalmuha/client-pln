use async_graphql::{InputObject, SimpleObject};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct Classification {
    pub id: i32,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, Debug, Clone)]
pub struct ClassificationWithTypeCount {
    pub id: i32,
    pub name: String,
    pub unit_type_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateClassificationInput {
    pub name: String,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateClassificationInput {
    pub id: i32,
    pub name: Option<String>,
}
