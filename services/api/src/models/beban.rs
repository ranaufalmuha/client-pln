use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct Beban {
    pub id: i32,
    pub bay_id: Option<i32>,
    pub bay_name: Option<String>,
    pub unit_id: Option<i32>,
    pub unit_name: Option<String>,
    pub unit_category_id: Option<i32>,
    pub unit_category_key: Option<String>,
    pub unit_category_name: Option<String>,
    pub kv: f64,
    pub a: f64,
    pub mw: f64,
    pub mvar: f64,
    pub percentage: f64,
    pub tap: Option<f64>,
    pub measured_at: String,
}

#[derive(InputObject)]
pub struct CreateBebanInput {
    pub bay_id: Option<i32>,
    pub kv: f64,
    pub a: f64,
    pub mw: f64,
    pub mvar: f64,
    pub percentage: f64,
    pub tap: Option<f64>,
    pub measured_at: String,
}

#[derive(InputObject)]
pub struct UpdateBebanInput {
    pub id: i32,
    pub bay_id: Option<i32>,
    pub kv: Option<f64>,
    pub a: Option<f64>,
    pub mw: Option<f64>,
    pub mvar: Option<f64>,
    pub percentage: Option<f64>,
    pub tap: Option<f64>,
    pub measured_at: Option<String>,
}
