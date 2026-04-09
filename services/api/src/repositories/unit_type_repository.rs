use sqlx::PgPool;
use crate::models::unit_type::{UnitType, UnitTypeWithRelations, CreateUnitTypeInput, UpdateUnitTypeInput};

pub struct UnitTypeRepository;

impl UnitTypeRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<UnitTypeWithRelations>, sqlx::Error> {
        sqlx::query_as::<_, UnitTypeWithRelations>(
            "
            SELECT 
                ut.id, 
                ut.classification_id,
                c.code as classification_code,
                c.name as classification_name,
                ut.code, 
                ut.name, 
                ut.created_at, 
                ut.updated_at,
                COUNT(u.id) as unit_count
            FROM unit_types ut
            JOIN classifications c ON c.id = ut.classification_id
            LEFT JOIN units u ON u.unit_type_id = ut.id
            GROUP BY ut.id, ut.classification_id, c.code, c.name, ut.code, ut.name, ut.created_at, ut.updated_at
            ORDER BY c.name ASC, ut.name ASC
            "
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_classification(pool: &PgPool, classification_id: i32) -> Result<Vec<UnitType>, sqlx::Error> {
        sqlx::query_as::<_, UnitType>(
            "
            SELECT id, classification_id, code, name, created_at, updated_at
            FROM unit_types
            WHERE classification_id = $1
            ORDER BY name ASC
            "
        )
        .bind(classification_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<UnitTypeWithRelations, sqlx::Error> {
        sqlx::query_as::<_, UnitTypeWithRelations>(
            "
            SELECT 
                ut.id, 
                ut.classification_id,
                c.code as classification_code,
                c.name as classification_name,
                ut.code, 
                ut.name, 
                ut.created_at, 
                ut.updated_at,
                COUNT(u.id) as unit_count
            FROM unit_types ut
            JOIN classifications c ON c.id = ut.classification_id
            LEFT JOIN units u ON u.unit_type_id = ut.id
            WHERE ut.id = $1
            GROUP BY ut.id, ut.classification_id, c.code, c.name, ut.code, ut.name, ut.created_at, ut.updated_at
            "
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn create(pool: &PgPool, input: CreateUnitTypeInput) -> Result<UnitType, sqlx::Error> {
        sqlx::query_as::<_, UnitType>(
            "
            INSERT INTO unit_types (classification_id, code, name)
            VALUES ($1, $2, $3)
            RETURNING id, classification_id, code, name, created_at, updated_at
            "
        )
        .bind(input.classification_id)
        .bind(input.code)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateUnitTypeInput) -> Result<UnitType, sqlx::Error> {
        sqlx::query_as::<_, UnitType>(
            "
            UPDATE unit_types
            SET 
                classification_id = COALESCE($2, classification_id),
                code = COALESCE($3, code),
                name = COALESCE($4, name),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, classification_id, code, name, created_at, updated_at
            "
        )
        .bind(input.id)
        .bind(input.classification_id)
        .bind(input.code)
        .bind(input.name)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM unit_types WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        
        Ok(result.rows_affected() > 0)
    }

    pub async fn has_units(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM units WHERE unit_type_id = $1"
        )
        .bind(id)
        .fetch_one(pool)
        .await?;
        
        Ok(count > 0)
    }
}
