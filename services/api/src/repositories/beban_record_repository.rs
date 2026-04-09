use sqlx::PgPool;
use sqlx::Row;
use crate::models::beban_record::{BebanRecord, BebanRecordWithRelations, CreateBebanRecordInput, UpdateBebanRecordInput, BebanRecordFilter};

pub struct BebanRecordRepository;

impl BebanRecordRepository {
    pub async fn find_all(pool: &PgPool, filter: Option<BebanRecordFilter>) -> Result<Vec<BebanRecordWithRelations>, sqlx::Error> {
        let mut sql = String::from("
            SELECT 
                br.id, 
                br.user_id,
                u.email as user_email,
                br.bay_id,
                b.name as bay_name,
                un.id as unit_id,
                un.name as unit_name,
                ut.id as unit_type_id,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.name as classification_name,
                br.recorded_at,
                br.kv,
                br.current_a,
                br.mw,
                br.mvar,
                br.percentage,
                br.tap,
                br.note,
                br.created_at,
                br.updated_at
            FROM beban_records br
            JOIN users u ON u.id = br.user_id
            JOIN bays b ON b.id = br.bay_id
            JOIN units un ON un.id = b.unit_id
            JOIN unit_types ut ON ut.id = un.unit_type_id
            JOIN classifications c ON c.id = ut.classification_id
            WHERE 1=1
        ");

        let mut _binds: Vec<i32> = vec![];
        
        if let Some(ref f) = filter {
            if f.classification_id.is_some() {
                sql.push_str(" AND c.id = $1");
            }
            if f.unit_type_id.is_some() {
                sql.push_str(" AND ut.id = $2");
            }
            if f.unit_id.is_some() {
                sql.push_str(" AND un.id = $3");
            }
            if f.bay_id.is_some() {
                sql.push_str(" AND b.id = $4");
            }
            if f.recorded_at_from.is_some() {
                sql.push_str(" AND br.recorded_at >= $5");
            }
            if f.recorded_at_to.is_some() {
                sql.push_str(" AND br.recorded_at <= $6");
            }
        }

        sql.push_str(" ORDER BY br.recorded_at DESC");

        let rows = sqlx::query(&sql)
            .bind(filter.as_ref().and_then(|f| f.classification_id))
            .bind(filter.as_ref().and_then(|f| f.unit_type_id))
            .bind(filter.as_ref().and_then(|f| f.unit_id))
            .bind(filter.as_ref().and_then(|f| f.bay_id))
            .bind(filter.as_ref().and_then(|f| f.recorded_at_from))
            .bind(filter.as_ref().and_then(|f| f.recorded_at_to))
            .fetch_all(pool)
            .await?;

        Ok(rows.into_iter().map(|row| BebanRecordWithRelations {
            id: row.try_get("id").unwrap_or(0),
            user_id: row.try_get("user_id").unwrap_or(0),
            user_email: row.try_get("user_email").unwrap_or_default(),
            bay_id: row.try_get("bay_id").unwrap_or(0),
            bay_name: row.try_get("bay_name").unwrap_or_default(),
            unit_id: row.try_get("unit_id").unwrap_or(0),
            unit_name: row.try_get("unit_name").unwrap_or_default(),
            unit_type_id: row.try_get("unit_type_id").unwrap_or(0),
            unit_type_name: row.try_get("unit_type_name").unwrap_or_default(),
            classification_id: row.try_get("classification_id").unwrap_or(0),
            classification_name: row.try_get("classification_name").unwrap_or_default(),
            recorded_at: row.try_get("recorded_at").unwrap_or_else(|_| chrono::Utc::now()),
            kv: row.try_get("kv").unwrap_or(0.0),
            current_a: row.try_get("current_a").unwrap_or(0.0),
            mw: row.try_get("mw").unwrap_or(0.0),
            mvar: row.try_get("mvar").unwrap_or(0.0),
            percentage: row.try_get("percentage").unwrap_or(0.0),
            tap: row.try_get("tap").ok(),
            note: row.try_get("note").ok(),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        }).collect())
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<BebanRecordWithRelations, sqlx::Error> {
        let row = sqlx::query("
            SELECT 
                br.id, 
                br.user_id,
                u.email as user_email,
                br.bay_id,
                b.name as bay_name,
                un.id as unit_id,
                un.name as unit_name,
                ut.id as unit_type_id,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.name as classification_name,
                br.recorded_at,
                br.kv,
                br.current_a,
                br.mw,
                br.mvar,
                br.percentage,
                br.tap,
                br.note,
                br.created_at,
                br.updated_at
            FROM beban_records br
            JOIN users u ON u.id = br.user_id
            JOIN bays b ON b.id = br.bay_id
            JOIN units un ON un.id = b.unit_id
            JOIN unit_types ut ON ut.id = un.unit_type_id
            JOIN classifications c ON c.id = ut.classification_id
            WHERE br.id = $1
        ")
        .bind(id)
        .fetch_one(pool)
        .await?;

        Ok(BebanRecordWithRelations {
            id: row.try_get("id").unwrap_or(0),
            user_id: row.try_get("user_id").unwrap_or(0),
            user_email: row.try_get("user_email").unwrap_or_default(),
            bay_id: row.try_get("bay_id").unwrap_or(0),
            bay_name: row.try_get("bay_name").unwrap_or_default(),
            unit_id: row.try_get("unit_id").unwrap_or(0),
            unit_name: row.try_get("unit_name").unwrap_or_default(),
            unit_type_id: row.try_get("unit_type_id").unwrap_or(0),
            unit_type_name: row.try_get("unit_type_name").unwrap_or_default(),
            classification_id: row.try_get("classification_id").unwrap_or(0),
            classification_name: row.try_get("classification_name").unwrap_or_default(),
            recorded_at: row.try_get("recorded_at").unwrap_or_else(|_| chrono::Utc::now()),
            kv: row.try_get("kv").unwrap_or(0.0),
            current_a: row.try_get("current_a").unwrap_or(0.0),
            mw: row.try_get("mw").unwrap_or(0.0),
            mvar: row.try_get("mvar").unwrap_or(0.0),
            percentage: row.try_get("percentage").unwrap_or(0.0),
            tap: row.try_get("tap").ok(),
            note: row.try_get("note").ok(),
            created_at: row.try_get("created_at").unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| chrono::Utc::now()),
        })
    }

    pub async fn create(pool: &PgPool, user_id: i32, input: CreateBebanRecordInput) -> Result<BebanRecord, sqlx::Error> {
        sqlx::query_as::<_, BebanRecord>(
            "
            INSERT INTO beban_records 
                (user_id, bay_id, recorded_at, kv, current_a, mw, mvar, percentage, tap, note)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING 
                id, user_id, bay_id, recorded_at, kv, current_a, mw, mvar, percentage, tap, note, created_at, updated_at
            "
        )
        .bind(user_id)
        .bind(input.bay_id)
        .bind(input.recorded_at)
        .bind(input.kv)
        .bind(input.current_a)
        .bind(input.mw)
        .bind(input.mvar)
        .bind(input.percentage)
        .bind(input.tap)
        .bind(input.note)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateBebanRecordInput) -> Result<BebanRecord, sqlx::Error> {
        sqlx::query_as::<_, BebanRecord>(
            "
            UPDATE beban_records
            SET 
                bay_id = COALESCE($2, bay_id),
                recorded_at = COALESCE($3, recorded_at),
                kv = COALESCE($4, kv),
                current_a = COALESCE($5, current_a),
                mw = COALESCE($6, mw),
                mvar = COALESCE($7, mvar),
                percentage = COALESCE($8, percentage),
                tap = COALESCE($9, tap),
                note = COALESCE($10, note),
                updated_at = NOW()
            WHERE id = $1
            RETURNING 
                id, user_id, bay_id, recorded_at, kv, current_a, mw, mvar, percentage, tap, note, created_at, updated_at
            "
        )
        .bind(input.id)
        .bind(input.bay_id)
        .bind(input.recorded_at)
        .bind(input.kv)
        .bind(input.current_a)
        .bind(input.mw)
        .bind(input.mvar)
        .bind(input.percentage)
        .bind(input.tap)
        .bind(input.note)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM beban_records WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        
        Ok(result.rows_affected() > 0)
    }
}
