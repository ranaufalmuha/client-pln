use sqlx::PgPool;

use crate::{
    auth::password::hash_password,
    models::user::{AdminCreateUserInput, AdminUpdateUserInput, User, UserRow},
};

pub struct UserRepository;

impl UserRepository {
    pub async fn count_all(pool: &PgPool) -> Result<i64, sqlx::Error> {
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await
    }

    pub async fn login(pool: &PgPool, email: &str) -> Result<UserRow, sqlx::Error> {
        sqlx::query_as::<_, UserRow>(
            "SELECT id, email, password, is_admin FROM users WHERE email = $1",
        )
        .bind(email)
        .fetch_one(pool)
        .await
    }

    pub async fn find_all(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
        sqlx::query_as::<_, User>("SELECT id, email, is_admin FROM users ORDER BY id DESC")
            .fetch_all(pool)
            .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<User, sqlx::Error> {
        sqlx::query_as::<_, User>("SELECT id, email, is_admin FROM users WHERE id = $1")
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn create_with_role(
        pool: &PgPool,
        input: AdminCreateUserInput,
    ) -> Result<User, sqlx::Error> {
        sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (email, password, is_admin)
            VALUES ($1, $2, $3)
            RETURNING id, email, is_admin
            "#,
        )
        .bind(input.email)
        .bind(hash_password(&input.password))
        .bind(input.is_admin)
        .fetch_one(pool)
        .await
    }

    pub async fn update_with_role(
        pool: &PgPool,
        input: AdminUpdateUserInput,
    ) -> Result<User, sqlx::Error> {
        let hashed_password = input.password.map(|plain| hash_password(&plain));

        sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET
                email = COALESCE($2, email),
                password = COALESCE($3, password),
                is_admin = COALESCE($4, is_admin),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, is_admin
            "#,
        )
        .bind(input.id)
        .bind(input.email)
        .bind(hashed_password)
        .bind(input.is_admin)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
