use async_graphql::{InputObject, SimpleObject};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct BebanRecord {
    pub id: i32,
    pub user_id: i32,
    pub bay_id: i32,
    pub recorded_at: chrono::DateTime<chrono::Utc>,
    pub kv: f64,
    pub current_a: f64,
    pub mw: f64,
    pub mvar: f64,
    pub percentage: f64,
    pub tap: Option<f64>,
    pub note: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, Debug, Clone)]
pub struct BebanRecordWithRelations {
    pub id: i32,
    pub user_id: i32,
    pub user_email: String,
    pub bay_id: i32,
    pub bay_name: String,
    pub unit_id: i32,
    pub unit_name: String,
    pub unit_type_id: i32,
    pub unit_type_name: String,
    pub classification_id: i32,
    pub classification_name: String,
    pub recorded_at: chrono::DateTime<chrono::Utc>,
    pub kv: f64,
    pub current_a: f64,
    pub mw: f64,
    pub mvar: f64,
    pub percentage: f64,
    pub tap: Option<f64>,
    pub note: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateBebanRecordInput {
    pub bay_id: i32,
    pub recorded_at: chrono::DateTime<chrono::Utc>,
    pub kv: f64,
    pub current_a: f64,
    pub mw: f64,
    pub mvar: f64,
    pub percentage: f64,
    pub tap: Option<f64>,
    pub note: Option<String>,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateBebanRecordInput {
    pub id: i32,
    pub bay_id: Option<i32>,
    pub recorded_at: Option<chrono::DateTime<chrono::Utc>>,
    pub kv: Option<f64>,
    pub current_a: Option<f64>,
    pub mw: Option<f64>,
    pub mvar: Option<f64>,
    pub percentage: Option<f64>,
    pub tap: Option<f64>,
    pub note: Option<String>,
}

#[derive(InputObject, Debug, Clone)]
pub struct BebanRecordFilter {
    pub classification_id: Option<i32>,
    pub unit_type_id: Option<i32>,
    pub unit_id: Option<i32>,
    pub bay_id: Option<i32>,
    pub recorded_at_from: Option<chrono::DateTime<chrono::Utc>>,
    pub recorded_at_to: Option<chrono::DateTime<chrono::Utc>>,
}
