use async_graphql::SimpleObject;
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct UnitType {
    pub id: i32,
    pub classification_id: i32,
    pub code: String,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct UnitTypeWithRelations {
    pub id: i32,
    pub classification_id: i32,
    pub classification_code: String,
    pub classification_name: String,
    pub code: String,
    pub name: String,
    pub unit_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateUnitTypeInput {
    pub classification_id: i32,
    pub code: String,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct UpdateUnitTypeInput {
    pub id: i32,
    pub classification_id: Option<i32>,
    pub code: Option<String>,
    pub name: Option<String>,
}
