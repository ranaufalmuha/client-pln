use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct Bay {
    pub id: i32,
    pub unit_id: i32,
    pub unit_name: String,
    pub unit_category_id: i32,
    pub unit_category_key: String,
    pub unit_category_name: String,
    pub name: String,
}

#[derive(InputObject)]
pub struct CreateBayInput {
    pub unit_id: i32,
    pub name: String,
}

#[derive(InputObject)]
pub struct UpdateBayInput {
    pub id: i32,
    pub unit_id: Option<i32>,
    pub name: Option<String>,
}
