use async_graphql::{InputObject, SimpleObject};
use sqlx::FromRow;

#[derive(SimpleObject, FromRow, Debug, Clone)]
pub struct Classification {
    pub id: i32,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(SimpleObject, Debug, Clone)]
pub struct ClassificationWithTypeCount {
    pub id: i32,
    pub name: String,
    pub unit_type_count: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl ClassificationWithTypeCount {
    pub fn new(
        id: i32,
        name: String,
        unit_type_count: i64,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
    ) -> Self {
        Self {
            id,
            name,
            unit_type_count,
            created_at,
            updated_at,
        }
    }
}

#[derive(InputObject, Debug, Clone)]
pub struct CreateClassificationInput {
    pub name: String,
}

#[derive(InputObject, Debug, Clone)]
pub struct UpdateClassificationInput {
    pub id: i32,
    pub name: Option<String>,
}
