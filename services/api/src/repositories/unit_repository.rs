use sqlx::PgPool;

use crate::models::unit::{CreateUnitInput, Unit, UpdateUnitInput};

pub struct UnitRepository;

impl UnitRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Unit>, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            r#"
            SELECT
                u.id,
                u.name,
                c.id AS category_id,
                c.key AS category_key,
                c.name AS category_name
            FROM units u
            JOIN unit_categories c ON c.id = u.category_id
            ORDER BY c.name, u.name
            "#,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Unit, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            r#"
            SELECT
                u.id,
                u.name,
                c.id AS category_id,
                c.key AS category_key,
                c.name AS category_name
            FROM units u
            JOIN unit_categories c ON c.id = u.category_id
            WHERE u.id = $1
            "#,
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn create(pool: &PgPool, input: CreateUnitInput) -> Result<Unit, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            r#"
            WITH inserted AS (
                INSERT INTO units (name, category_id, category)
                VALUES (
                    $1,
                    $2,
                    (SELECT key FROM unit_categories WHERE id = $2)
                )
                RETURNING id, name, category_id
            )
            SELECT
                inserted.id,
                inserted.name,
                c.id AS category_id,
                c.key AS category_key,
                c.name AS category_name
            FROM inserted
            JOIN unit_categories c ON c.id = inserted.category_id
            "#,
        )
        .bind(input.name)
        .bind(input.category_id)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateUnitInput) -> Result<Unit, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            r#"
            WITH updated AS (
                UPDATE units
                SET
                    name = COALESCE($2, name),
                    category_id = COALESCE($3, category_id),
                    category = COALESCE(
                        (SELECT key FROM unit_categories WHERE id = COALESCE($3, category_id)),
                        category
                    ),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, name, category_id
            )
            SELECT
                updated.id,
                updated.name,
                c.id AS category_id,
                c.key AS category_key,
                c.name AS category_name
            FROM updated
            JOIN unit_categories c ON c.id = updated.category_id
            "#,
        )
        .bind(input.id)
        .bind(input.name)
        .bind(input.category_id)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM units WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
