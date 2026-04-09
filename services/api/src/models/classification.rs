use async_graphql::SimpleObject;
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct Classification {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, Debug, Clone)]
pub struct ClassificationWithTypeCount {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub unit_type_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateClassificationInput {
    pub code: String,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct UpdateClassificationInput {
    pub id: i32,
    pub code: Option<String>,
    pub name: Option<String>,
}
