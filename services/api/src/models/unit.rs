use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct Unit {
    pub id: i32,
    pub unit_type_id: i32,
    pub code: Option<String>,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct UnitWithRelations {
    pub id: i32,
    pub unit_type_id: i32,
    pub unit_type_code: String,
    pub unit_type_name: String,
    pub classification_id: i32,
    pub classification_code: String,
    pub classification_name: String,
    pub code: Option<String>,
    pub name: String,
    pub bay_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateUnitInput {
    pub unit_type_id: i32,
    pub code: Option<String>,
    pub name: String,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateUnitInput {
    pub id: i32,
    pub unit_type_id: Option<i32>,
    pub code: Option<String>,
    pub name: Option<String>,
}

// Legacy types for backward compatibility
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct UnitLegacy {
    pub id: i32,
    pub name: String,
    pub category_id: i32,
    pub category_key: String,
    pub category_name: String,
}

#[derive(InputObject)]
pub struct CreateUnitInputLegacy {
    pub name: String,
    pub category_id: i32,
}

#[derive(InputObject)]
pub struct UpdateUnitInputLegacy {
    pub id: i32,
    pub name: Option<String>,
    pub category_id: Option<i32>,
}
