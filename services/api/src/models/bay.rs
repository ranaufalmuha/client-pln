use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct Bay {
    pub id: i32,
    pub unit_id: i32,
    pub code: Option<String>,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct BayWithRelations {
    pub id: i32,
    pub unit_id: i32,
    pub unit_code: Option<String>,
    pub unit_name: String,
    pub unit_type_id: i32,
    pub unit_type_code: String,
    pub unit_type_name: String,
    pub classification_id: i32,
    pub classification_code: String,
    pub classification_name: String,
    pub code: Option<String>,
    pub name: String,
    pub beban_record_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateBayInput {
    pub unit_id: i32,
    pub code: Option<String>,
    pub name: String,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateBayInput {
    pub id: i32,
    pub unit_id: Option<i32>,
    pub code: Option<String>,
    pub name: Option<String>,
}

// Legacy types for backward compatibility
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct BayLegacy {
    pub id: i32,
    pub unit_id: i32,
    pub unit_name: String,
    pub unit_category_id: i32,
    pub unit_category_key: String,
    pub unit_category_name: String,
    pub name: String,
}

#[derive(InputObject)]
pub struct CreateBayInputLegacy {
    pub unit_id: i32,
    pub name: String,
}

#[derive(InputObject)]
pub struct UpdateBayInputLegacy {
    pub id: i32,
    pub unit_id: Option<i32>,
    pub name: Option<String>,
}
