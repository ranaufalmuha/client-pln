use async_graphql::{InputObject, SimpleObject};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct Unit {
    pub id: i32,
    pub unit_type_id: i32,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, Debug, Clone)]
pub struct UnitWithRelations {
    pub id: i32,
    pub unit_type_id: i32,
    pub unit_type_name: String,
    pub classification_id: i32,
    pub classification_name: String,
    pub name: String,
    pub bay_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateUnitInput {
    pub unit_type_id: i32,
    pub name: String,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateUnitInput {
    pub id: i32,
    pub unit_type_id: Option<i32>,
    pub name: Option<String>,
}
