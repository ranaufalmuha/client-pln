use async_graphql::{InputObject, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserRow {
    pub id: i32,
    pub email: String,
    pub password: String,
    pub is_admin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub is_admin: bool,
}

impl From<UserRow> for User {
    fn from(value: UserRow) -> Self {
        Self {
            id: value.id,
            email: value.email,
            is_admin: value.is_admin,
        }
    }
}

#[derive(InputObject)]
pub struct CreateUserInput {
    pub email: String,
    pub password: String,
}

#[derive(InputObject)]
pub struct AdminCreateUserInput {
    pub email: String,
    pub password: String,
    pub is_admin: bool,
}

#[derive(InputObject)]
pub struct AdminUpdateUserInput {
    pub id: i32,
    pub email: Option<String>,
    pub password: Option<String>,
    pub is_admin: Option<bool>,
}

#[derive(SimpleObject)]
pub struct AuthPayload {
    pub token: String,
    pub user: User,
}
