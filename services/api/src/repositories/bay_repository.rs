use sqlx::PgPool;
use sqlx::Row;
use crate::models::bay::{Bay, BayWithRelations, CreateBayInput, UpdateBayInput};
use crate::models::bay::{BayLegacy, CreateBayInputLegacy, UpdateBayInputLegacy};

pub struct BayRepository;

impl BayRepository {
    // New schema methods
    pub async fn find_all(pool: &PgPool) -> Result<Vec<BayWithRelations>, sqlx::Error> {
        let rows = sqlx::query("
            SELECT 
                b.id, 
                b.unit_id,
                u.name as unit_name,
                ut.id as unit_type_id,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.name as classification_name,
                b.name, 
                b.created_at, 
                b.updated_at,
                COUNT(br.id) as beban_record_count
            FROM bays b
            JOIN units u ON u.id = b.unit_id
            JOIN unit_types ut ON ut.id = u.unit_type_id
            JOIN classifications c ON c.id = ut.classification_id
            LEFT JOIN beban_records br ON br.bay_id = b.id
            GROUP BY b.id, b.unit_id, u.name, ut.id, ut.name, c.id, c.name, b.name, b.created_at, b.updated_at
            ORDER BY c.name ASC, ut.name ASC, u.name ASC, b.name ASC
        ")
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|row| BayWithRelations {
            id: row.try_get("id").unwrap_or(0),
            unit_id: row.try_get("unit_id").unwrap_or(0),
            unit_name: row.try_get("unit_name").unwrap_or_default(),
            unit_type_id: row.try_get("unit_type_id").unwrap_or(0),
            unit_type_name: row.try_get("unit_type_name").unwrap_or_default(),
            classification_id: row.try_get("classification_id").unwrap_or(0),
            classification_name: row.try_get("classification_name").unwrap_or_default(),
            name: row.try_get("name").unwrap_or_default(),
            beban_record_count: row.try_get("beban_record_count").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        }).collect())
    }

    pub async fn find_by_unit(pool: &PgPool, unit_id: i32) -> Result<Vec<Bay>, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            "
            SELECT id, unit_id, name, created_at, updated_at
            FROM bays
            WHERE unit_id = $1
            ORDER BY name ASC
            "
        )
        .bind(unit_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<BayWithRelations, sqlx::Error> {
        let row = sqlx::query("
            SELECT 
                b.id, 
                b.unit_id,
                u.name as unit_name,
                ut.id as unit_type_id,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.name as classification_name,
                b.name, 
                b.created_at, 
                b.updated_at,
                COUNT(br.id) as beban_record_count
            FROM bays b
            JOIN units u ON u.id = b.unit_id
            JOIN unit_types ut ON ut.id = u.unit_type_id
            JOIN classifications c ON c.id = ut.classification_id
            LEFT JOIN beban_records br ON br.bay_id = b.id
            WHERE b.id = $1
            GROUP BY b.id, b.unit_id, u.name, ut.id, ut.name, c.id, c.name, b.name, b.created_at, b.updated_at
        ")
        .bind(id)
        .fetch_one(pool)
        .await?;

        Ok(BayWithRelations {
            id: row.try_get("id").unwrap_or(0),
            unit_id: row.try_get("unit_id").unwrap_or(0),
            unit_name: row.try_get("unit_name").unwrap_or_default(),
            unit_type_id: row.try_get("unit_type_id").unwrap_or(0),
            unit_type_name: row.try_get("unit_type_name").unwrap_or_default(),
            classification_id: row.try_get("classification_id").unwrap_or(0),
            classification_name: row.try_get("classification_name").unwrap_or_default(),
            name: row.try_get("name").unwrap_or_default(),
            beban_record_count: row.try_get("beban_record_count").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        })
    }

    pub async fn create(pool: &PgPool, input: CreateBayInput) -> Result<Bay, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            "
            INSERT INTO bays (unit_id, name)
            VALUES ($1, $2)
            RETURNING id, unit_id, name, created_at, updated_at
            "
        )
        .bind(input.unit_id)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateBayInput) -> Result<Bay, sqlx::Error> {
        sqlx::query_as::<_, Bay>(
            "
            UPDATE bays
            SET 
                unit_id = COALESCE($2, unit_id),
                name = COALESCE($3, name),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, unit_id, name, created_at, updated_at
            "
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

    pub async fn has_beban_records(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM beban_records WHERE bay_id = $1"
        )
        .bind(id)
        .fetch_one(pool)
        .await?;
        
        Ok(count > 0)
    }

    // Legacy compatibility methods
    pub async fn find_all_legacy(pool: &PgPool, unit_id: Option<i32>) -> Result<Vec<BayLegacy>, sqlx::Error> {
        sqlx::query_as::<_, BayLegacy>(
            "
            SELECT
                b.id,
                b.unit_id,
                u.name AS unit_name,
                ut.id AS unit_category_id,
                ut.name AS unit_category_key,
                ut.name AS unit_category_name,
                b.name
            FROM bays b
            JOIN units u ON u.id = b.unit_id
            JOIN unit_types ut ON ut.id = u.unit_type_id
            WHERE ($1::INT IS NULL OR b.unit_id = $1)
            ORDER BY ut.name, u.name, b.name
            "
        )
        .bind(unit_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_legacy(pool: &PgPool, input: CreateBayInputLegacy) -> Result<BayLegacy, sqlx::Error> {
        sqlx::query_as::<_, BayLegacy>(
            "
            WITH inserted AS (
                INSERT INTO bays (unit_id, name)
                VALUES ($1, $2)
                RETURNING id, unit_id, name
            )
            SELECT
                inserted.id,
                inserted.unit_id,
                u.name AS unit_name,
                ut.id AS unit_category_id,
                ut.name AS unit_category_key,
                ut.name AS unit_category_name,
                inserted.name
            FROM inserted
            JOIN units u ON u.id = inserted.unit_id
            JOIN unit_types ut ON ut.id = u.unit_type_id
            "
        )
        .bind(input.unit_id)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }
}
