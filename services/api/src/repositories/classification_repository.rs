use sqlx::PgPool;
use sqlx::Row;
use crate::models::classification::{Classification, ClassificationWithTypeCount, CreateClassificationInput, UpdateClassificationInput};

pub struct ClassificationRepository;

impl ClassificationRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Classification>, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            SELECT id, name, created_at, updated_at
            FROM classifications
            ORDER BY name ASC
            "
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_all_with_counts(pool: &PgPool) -> Result<Vec<ClassificationWithTypeCount>, sqlx::Error> {
        let rows = sqlx::query("
            SELECT 
                c.id, 
                c.name, 
                c.created_at, 
                c.updated_at,
                COUNT(ut.id) as unit_type_count
            FROM classifications c
            LEFT JOIN unit_types ut ON ut.classification_id = c.id
            GROUP BY c.id, c.name, c.created_at, c.updated_at
            ORDER BY c.name ASC
        ")
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|row| ClassificationWithTypeCount {
            id: row.try_get("id").unwrap_or(0),
            name: row.try_get("name").unwrap_or_default(),
            unit_type_count: row.try_get("unit_type_count").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        }).collect())
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Classification, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            SELECT id, name, created_at, updated_at
            FROM classifications
            WHERE id = $1
            "
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn create(pool: &PgPool, input: CreateClassificationInput) -> Result<Classification, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            INSERT INTO classifications (name)
            VALUES ($1)
            RETURNING id, name, created_at, updated_at
            "
        )
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateClassificationInput) -> Result<Classification, sqlx::Error> {
        sqlx::query_as::<_, Classification>(
            "
            UPDATE classifications
            SET 
                name = COALESCE($2, name),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, created_at, updated_at
            "
        )
        .bind(input.id)
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
