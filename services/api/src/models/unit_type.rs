use async_graphql::{InputObject, SimpleObject};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct UnitType {
    pub id: i32,
    pub classification_id: i32,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, Debug, Clone)]
pub struct UnitTypeWithRelations {
    pub id: i32,
    pub classification_id: i32,
    pub classification_name: String,
    pub name: String,
    pub unit_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateUnitTypeInput {
    pub classification_id: i32,
    pub name: String,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateUnitTypeInput {
    pub id: i32,
    pub classification_id: Option<i32>,
    pub name: Option<String>,
}
