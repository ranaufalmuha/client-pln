use sqlx::PgPool;
use sqlx::Row;
use crate::models::unit::{Unit, UnitWithRelations, CreateUnitInput, UpdateUnitInput};
use crate::models::unit::{UnitLegacy, CreateUnitInputLegacy, UpdateUnitInputLegacy};

pub struct UnitRepository;

impl UnitRepository {
    // New schema methods
    pub async fn find_all(pool: &PgPool) -> Result<Vec<UnitWithRelations>, sqlx::Error> {
        let rows = sqlx::query("
            SELECT 
                u.id, 
                u.unit_type_id,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.name as classification_name,
                u.name, 
                u.created_at, 
                u.updated_at,
                COUNT(b.id) as bay_count
            FROM units u
            JOIN unit_types ut ON ut.id = u.unit_type_id
            JOIN classifications c ON c.id = ut.classification_id
            LEFT JOIN bays b ON b.unit_id = u.id
            GROUP BY u.id, u.unit_type_id, ut.name, c.id, c.name, u.name, u.created_at, u.updated_at
            ORDER BY c.name ASC, ut.name ASC, u.name ASC
        ")
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|row| UnitWithRelations {
            id: row.try_get("id").unwrap_or(0),
            unit_type_id: row.try_get("unit_type_id").unwrap_or(0),
            unit_type_name: row.try_get("unit_type_name").unwrap_or_default(),
            classification_id: row.try_get("classification_id").unwrap_or(0),
            classification_name: row.try_get("classification_name").unwrap_or_default(),
            name: row.try_get("name").unwrap_or_default(),
            bay_count: row.try_get("bay_count").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        }).collect())
    }

    pub async fn find_by_unit_type(pool: &PgPool, unit_type_id: i32) -> Result<Vec<Unit>, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            "
            SELECT id, unit_type_id, name, created_at, updated_at
            FROM units
            WHERE unit_type_id = $1
            ORDER BY name ASC
            "
        )
        .bind(unit_type_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<UnitWithRelations, sqlx::Error> {
        let row = sqlx::query("
            SELECT 
                u.id, 
                u.unit_type_id,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.name as classification_name,
                u.name, 
                u.created_at, 
                u.updated_at,
                COUNT(b.id) as bay_count
            FROM units u
            JOIN unit_types ut ON ut.id = u.unit_type_id
            JOIN classifications c ON c.id = ut.classification_id
            LEFT JOIN bays b ON b.unit_id = u.id
            WHERE u.id = $1
            GROUP BY u.id, u.unit_type_id, ut.name, c.id, c.name, u.name, u.created_at, u.updated_at
        ")
        .bind(id)
        .fetch_one(pool)
        .await?;

        Ok(UnitWithRelations {
            id: row.try_get("id").unwrap_or(0),
            unit_type_id: row.try_get("unit_type_id").unwrap_or(0),
            unit_type_name: row.try_get("unit_type_name").unwrap_or_default(),
            classification_id: row.try_get("classification_id").unwrap_or(0),
            classification_name: row.try_get("classification_name").unwrap_or_default(),
            name: row.try_get("name").unwrap_or_default(),
            bay_count: row.try_get("bay_count").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        })
    }

    pub async fn create(pool: &PgPool, input: CreateUnitInput) -> Result<Unit, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            "
            INSERT INTO units (unit_type_id, name)
            VALUES ($1, $2)
            RETURNING id, unit_type_id, name, created_at, updated_at
            "
        )
        .bind(input.unit_type_id)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateUnitInput) -> Result<Unit, sqlx::Error> {
        sqlx::query_as::<_, Unit>(
            "
            UPDATE units
            SET 
                unit_type_id = COALESCE($2, unit_type_id),
                name = COALESCE($3, name),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, unit_type_id, name, created_at, updated_at
            "
        )
        .bind(input.id)
        .bind(input.unit_type_id)
        .bind(input.name)
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

    pub async fn has_bays(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM bays WHERE unit_id = $1"
        )
        .bind(id)
        .fetch_one(pool)
        .await?;
        
        Ok(count > 0)
    }

    // Legacy compatibility methods
    pub async fn find_all_legacy(pool: &PgPool) -> Result<Vec<UnitLegacy>, sqlx::Error> {
        sqlx::query_as::<_, UnitLegacy>(
            "
            SELECT
                u.id,
                u.name,
                ut.id AS category_id,
                ut.name AS category_key,
                ut.name AS category_name
            FROM units u
            JOIN unit_types ut ON ut.id = u.unit_type_id
            ORDER BY ut.name, u.name
            "
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create_legacy(pool: &PgPool, input: CreateUnitInputLegacy) -> Result<UnitLegacy, sqlx::Error> {
        sqlx::query_as::<_, UnitLegacy>(
            "
            WITH inserted AS (
                INSERT INTO units (name, unit_type_id)
                VALUES ($1, $2)
                RETURNING id, name, unit_type_id
            )
            SELECT
                inserted.id,
                inserted.name,
                ut.id AS category_id,
                ut.name AS category_key,
                ut.name AS category_name
            FROM inserted
            JOIN unit_types ut ON ut.id = inserted.unit_type_id
            "
        )
        .bind(input.name)
        .bind(input.category_id)
        .fetch_one(pool)
        .await
    }
}
