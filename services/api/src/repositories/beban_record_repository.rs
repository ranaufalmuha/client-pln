use sqlx::PgPool;
use crate::models::beban_record::{BebanRecord, BebanRecordWithRelations, CreateBebanRecordInput, UpdateBebanRecordInput, BebanRecordFilter};

pub struct BebanRecordRepository;

impl BebanRecordRepository {
    pub async fn find_all(pool: &PgPool, filter: Option<BebanRecordFilter>) -> Result<Vec<BebanRecordWithRelations>, sqlx::Error> {
        let mut query = String::from(
            "
            SELECT 
                br.id, 
                br.user_id,
                u.email as user_email,
                br.bay_id,
                b.code as bay_code,
                b.name as bay_name,
                un.id as unit_id,
                un.code as unit_code,
                un.name as unit_name,
                ut.id as unit_type_id,
                ut.code as unit_type_code,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.code as classification_code,
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
            "
        );

        if let Some(f) = &filter {
            if f.classification_id.is_some() {
                query.push_str(" AND c.id = $1");
            }
            if f.unit_type_id.is_some() {
                query.push_str(" AND ut.id = $2");
            }
            if f.unit_id.is_some() {
                query.push_str(" AND un.id = $3");
            }
            if f.bay_id.is_some() {
                query.push_str(" AND b.id = $4");
            }
            if f.recorded_at_from.is_some() {
                query.push_str(" AND br.recorded_at >= $5");
            }
            if f.recorded_at_to.is_some() {
                query.push_str(" AND br.recorded_at <= $6");
            }
        }

        query.push_str(" ORDER BY br.recorded_at DESC");

        let mut sql_query = sqlx::query_as::<_, BebanRecordWithRelations>(&query);

        if let Some(f) = filter {
            sql_query = sql_query.bind(f.classification_id);
            sql_query = sql_query.bind(f.unit_type_id);
            sql_query = sql_query.bind(f.unit_id);
            sql_query = sql_query.bind(f.bay_id);
            sql_query = sql_query.bind(f.recorded_at_from);
            sql_query = sql_query.bind(f.recorded_at_to);
        }

        sql_query.fetch_all(pool).await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<BebanRecordWithRelations, sqlx::Error> {
        sqlx::query_as::<_, BebanRecordWithRelations>(
            "
            SELECT 
                br.id, 
                br.user_id,
                u.email as user_email,
                br.bay_id,
                b.code as bay_code,
                b.name as bay_name,
                un.id as unit_id,
                un.code as unit_code,
                un.name as unit_name,
                ut.id as unit_type_id,
                ut.code as unit_type_code,
                ut.name as unit_type_name,
                c.id as classification_id,
                c.code as classification_code,
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
            "
        )
        .bind(id)
        .fetch_one(pool)
        .await
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

    pub async fn count_by_bay(pool: &PgPool, bay_id: i32) -> Result<i64, sqlx::Error> {
        sqlx::query_scalar("SELECT COUNT(*) FROM beban_records WHERE bay_id = $1")
            .bind(bay_id)
            .fetch_one(pool)
            .await
    }
}
