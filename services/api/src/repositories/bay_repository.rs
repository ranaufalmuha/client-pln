use sqlx::PgPool;

use crate::models::bay::{Bay, CreateBayInput, UpdateBayInput};

pub struct BayRepository;

impl BayRepository {
    pub async fn find_all(pool: &PgPool, unit_id: Option<i32>) -> Result<Vec<Bay>, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            r#"
            SELECT
                b.id,
                b.unit_id,
                u.name AS unit_name,
                c.id AS unit_category_id,
                c.key AS unit_category_key,
                c.name AS unit_category_name,
                b.name
            FROM bays b
            JOIN units u ON u.id = b.unit_id
            JOIN unit_categories c ON c.id = u.category_id
            WHERE ($1::INT IS NULL OR b.unit_id = $1)
            ORDER BY c.name, u.name, b.name
            "#,
        )
        .bind(unit_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Bay, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            r#"
            SELECT
                b.id,
                b.unit_id,
                u.name AS unit_name,
                c.id AS unit_category_id,
                c.key AS unit_category_key,
                c.name AS unit_category_name,
                b.name
            FROM bays b
            JOIN units u ON u.id = b.unit_id
            JOIN unit_categories c ON c.id = u.category_id
            WHERE b.id = $1
            "#,
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn create(pool: &PgPool, input: CreateBayInput) -> Result<Bay, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            r#"
            WITH inserted AS (
                INSERT INTO bays (unit_id, name)
                VALUES ($1, $2)
                RETURNING id, unit_id, name
            )
            SELECT
                inserted.id,
                inserted.unit_id,
                u.name AS unit_name,
                c.id AS unit_category_id,
                c.key AS unit_category_key,
                c.name AS unit_category_name,
                inserted.name
            FROM inserted
            JOIN units u ON u.id = inserted.unit_id
            JOIN unit_categories c ON c.id = u.category_id
            "#,
        )
        .bind(input.unit_id)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateBayInput) -> Result<Bay, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            r#"
            WITH updated AS (
                UPDATE bays
                SET
                    unit_id = COALESCE($2, unit_id),
                    name = COALESCE($3, name),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, unit_id, name
            )
            SELECT
                updated.id,
                updated.unit_id,
                u.name AS unit_name,
                c.id AS unit_category_id,
                c.key AS unit_category_key,
                c.name AS unit_category_name,
                updated.name
            FROM updated
            JOIN units u ON u.id = updated.unit_id
            JOIN unit_categories c ON c.id = u.category_id
            "#,
        )
        .bind(input.id)
        .bind(input.unit_id)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM bays WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
