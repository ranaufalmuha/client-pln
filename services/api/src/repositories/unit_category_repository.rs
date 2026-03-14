use sqlx::PgPool;

use crate::models::unit_category::{
    CreateUnitCategoryInput, UnitCategory, UpdateUnitCategoryInput,
};

pub struct UnitCategoryRepository;

impl UnitCategoryRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<UnitCategory>, sqlx::Error> {
        sqlx::query_as::<_, UnitCategory>(
            "SELECT id, key, name FROM unit_categories ORDER BY name, key",
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<UnitCategory, sqlx::Error> {
        sqlx::query_as::<_, UnitCategory>("SELECT id, key, name FROM unit_categories WHERE id = $1")
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn create(
        pool: &PgPool,
        input: CreateUnitCategoryInput,
    ) -> Result<UnitCategory, sqlx::Error> {
        sqlx::query_as::<_, UnitCategory>(
            r#"
            INSERT INTO unit_categories (key, name)
            VALUES ($1, $2)
            RETURNING id, key, name
            "#,
        )
        .bind(input.key)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        pool: &PgPool,
        input: UpdateUnitCategoryInput,
    ) -> Result<UnitCategory, sqlx::Error> {
        sqlx::query_as::<_, UnitCategory>(
            r#"
            UPDATE unit_categories
            SET
                key = COALESCE($2, key),
                name = COALESCE($3, name),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, key, name
            "#,
        )
        .bind(input.id)
        .bind(input.key)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM unit_categories WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
