use sqlx::PgPool;
use crate::models::classification::{Classification, ClassificationWithTypeCount, CreateClassificationInput, UpdateClassificationInput};

pub struct ClassificationRepository;

impl ClassificationRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Classification>, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            SELECT id, code, name, created_at, updated_at
            FROM classifications
            ORDER BY name ASC
            "
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_all_with_counts(pool: &PgPool) -> Result<Vec<ClassificationWithTypeCount>, sqlx::Error> {
        sqlx::query_as::<_, ClassificationWithTypeCount>(
            "
            SELECT 
                c.id, 
                c.code, 
                c.name, 
                c.created_at, 
                c.updated_at,
                COUNT(ut.id) as unit_type_count
            FROM classifications c
            LEFT JOIN unit_types ut ON ut.classification_id = c.id
            GROUP BY c.id, c.code, c.name, c.created_at, c.updated_at
            ORDER BY c.name ASC
            "
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Classification, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            SELECT id, code, name, created_at, updated_at
            FROM classifications
            WHERE id = $1
            "
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_code(pool: &PgPool, code: &str) -> Result<Option<Classification>, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            SELECT id, code, name, created_at, updated_at
            FROM classifications
            WHERE code = $1
            "
        )
        .bind(code)
        .fetch_optional(pool)
        .await
    }

    pub async fn create(pool: &PgPool, input: CreateClassificationInput) -> Result<Classification, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            INSERT INTO classifications (code, name)
            VALUES ($1, $2)
            RETURNING id, code, name, created_at, updated_at
            "
        )
        .bind(input.code)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateClassificationInput) -> Result<Classification, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            UPDATE classifications
            SET 
                code = COALESCE($2, code),
                name = COALESCE($3, name),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, code, name, created_at, updated_at
            "
        )
        .bind(input.id)
        .bind(input.code)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM classifications WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        
        Ok(result.rows_affected() > 0)
    }

    pub async fn has_unit_types(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM unit_types WHERE classification_id = $1"
        )
        .bind(id)
        .fetch_one(pool)
        .await?;
        
        Ok(count > 0)
    }
}
