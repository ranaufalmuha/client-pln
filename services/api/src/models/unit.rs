use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct Unit {
    pub id: i32,
    pub name: String,
    pub category_id: i32,
    pub category_key: String,
    pub category_name: String,
}

#[derive(InputObject)]
pub struct CreateUnitInput {
    pub name: String,
    pub category_id: i32,
}

#[derive(InputObject)]
pub struct UpdateUnitInput {
    pub id: i32,
    pub name: Option<String>,
    pub category_id: Option<i32>,
}
