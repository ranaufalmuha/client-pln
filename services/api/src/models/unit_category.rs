use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct UnitCategory {
    pub id: i32,
    pub key: String,
    pub name: String,
}

#[derive(InputObject)]
pub struct CreateUnitCategoryInput {
    pub key: String,
    pub name: String,
}

#[derive(InputObject)]
pub struct UpdateUnitCategoryInput {
    pub id: i32,
    pub key: Option<String>,
    pub name: Option<String>,
}
