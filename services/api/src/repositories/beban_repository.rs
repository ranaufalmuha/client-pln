use sqlx::PgPool;

use crate::models::beban::{Beban, CreateBebanInput, UpdateBebanInput};

const BEBAN_SELECT: &str = r#"
SELECT
    b.id,
    b.bay_id,
    bays.name AS bay_name,
    units.id AS unit_id,
    units.name AS unit_name,
    categories.id AS unit_category_id,
    categories.key AS unit_category_key,
    categories.name AS unit_category_name,
    b.kv::double precision AS kv,
    b.a::double precision AS a,
    b.mw::double precision AS mw,
    b.mvar::double precision AS mvar,
    b.percentage::double precision AS percentage,
    b.tap::double precision AS tap,
    to_char(b.measured_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS measured_at
FROM bebans b
LEFT JOIN bays ON bays.id = b.bay_id
LEFT JOIN units ON units.id = bays.unit_id
LEFT JOIN unit_categories categories ON categories.id = units.category_id
"#;

pub struct BebanRepository;

impl BebanRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Beban>, sqlx::Error> {
        let query = format!("{BEBAN_SELECT} ORDER BY b.measured_at DESC, b.id DESC");
        sqlx::query_as::<_, Beban>(&query).fetch_all(pool).await
    }

    pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Beban, sqlx::Error> {
        let query = format!("{BEBAN_SELECT} WHERE b.id = $1");
        sqlx::query_as::<_, Beban>(&query)
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn create(pool: &PgPool, input: CreateBebanInput) -> Result<Beban, sqlx::Error> {
        sqlx::query_as::<_, Beban>(
            r#"
            WITH inserted AS (
                INSERT INTO bebans (
                    bay_id, kv, a, mw, mvar, percentage, tap, measured_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz)
                RETURNING id, bay_id, kv, a, mw, mvar, percentage, tap, measured_at
            )
            SELECT
                inserted.id,
                inserted.bay_id,
                bays.name AS bay_name,
                units.id AS unit_id,
                units.name AS unit_name,
                categories.id AS unit_category_id,
                categories.key AS unit_category_key,
                categories.name AS unit_category_name,
                inserted.kv::double precision AS kv,
                inserted.a::double precision AS a,
                inserted.mw::double precision AS mw,
                inserted.mvar::double precision AS mvar,
                inserted.percentage::double precision AS percentage,
                inserted.tap::double precision AS tap,
                to_char(inserted.measured_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS measured_at
            FROM inserted
            LEFT JOIN bays ON bays.id = inserted.bay_id
            LEFT JOIN units ON units.id = bays.unit_id
            LEFT JOIN unit_categories categories ON categories.id = units.category_id
            "#,
        )
        .bind(input.bay_id)
        .bind(input.kv)
        .bind(input.a)
        .bind(input.mw)
        .bind(input.mvar)
        .bind(input.percentage)
        .bind(input.tap)
        .bind(input.measured_at)
        .fetch_one(pool)
        .await
    }

    pub async fn update(pool: &PgPool, input: UpdateBebanInput) -> Result<Beban, sqlx::Error> {
        sqlx::query_as::<_, Beban>(
            r#"
            WITH updated AS (
                UPDATE bebans
                SET
                    bay_id = COALESCE($2, bay_id),
                    kv = COALESCE($3, kv),
                    a = COALESCE($4, a),
                    mw = COALESCE($5, mw),
                    mvar = COALESCE($6, mvar),
                    percentage = COALESCE($7, percentage),
                    tap = COALESCE($8, tap),
                    measured_at = COALESCE($9::timestamptz, measured_at),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, bay_id, kv, a, mw, mvar, percentage, tap, measured_at
            )
            SELECT
                updated.id,
                updated.bay_id,
                bays.name AS bay_name,
                units.id AS unit_id,
                units.name AS unit_name,
                categories.id AS unit_category_id,
                categories.key AS unit_category_key,
                categories.name AS unit_category_name,
                updated.kv::double precision AS kv,
                updated.a::double precision AS a,
                updated.mw::double precision AS mw,
                updated.mvar::double precision AS mvar,
                updated.percentage::double precision AS percentage,
                updated.tap::double precision AS tap,
                to_char(updated.measured_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS measured_at
            FROM updated
            LEFT JOIN bays ON bays.id = updated.bay_id
            LEFT JOIN units ON units.id = bays.unit_id
            LEFT JOIN unit_categories categories ON categories.id = units.category_id
            "#,
        )
        .bind(input.id)
        .bind(input.bay_id)
        .bind(input.kv)
        .bind(input.a)
        .bind(input.mw)
        .bind(input.mvar)
        .bind(input.percentage)
        .bind(input.tap)
        .bind(input.measured_at)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM bebans WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
