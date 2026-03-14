use sqlx::PgPool;

pub async fn ensure_schema(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS unit_categories (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO unit_categories (key, name)
        VALUES
            ('penghantar-gitet', 'Penghantar GITET'),
            ('ibt-gitet', 'IBT GITET'),
            ('penghantar-gi', 'Penghantar GI'),
            ('ibt-trafo-gi', 'IBT/Trafo GI')
        ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS units (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            category_id INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("ALTER TABLE units ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'penghantar-gitet'")
        .execute(pool)
        .await?;
    sqlx::query("ALTER TABLE units ADD COLUMN IF NOT EXISTS category_id INTEGER")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"
        INSERT INTO unit_categories (key, name)
        SELECT DISTINCT u.category, u.category
        FROM units u
        LEFT JOIN unit_categories c ON c.key = u.category
        WHERE c.id IS NULL
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        UPDATE units u
        SET category_id = c.id
        FROM unit_categories c
        WHERE u.category_id IS NULL
          AND c.key = u.category
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        UPDATE units
        SET category_id = (SELECT id FROM unit_categories ORDER BY id ASC LIMIT 1)
        WHERE category_id IS NULL
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query("ALTER TABLE units ALTER COLUMN category_id SET NOT NULL")
        .execute(pool)
        .await?;
    sqlx::query(
        r#"
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_units_category_id'
            ) THEN
                ALTER TABLE units
                ADD CONSTRAINT fk_units_category_id
                FOREIGN KEY (category_id) REFERENCES unit_categories(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("DROP INDEX IF EXISTS idx_units_category_name")
        .execute(pool)
        .await?;
    sqlx::query(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_units_category_id_name ON units(category_id, name)",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO units (name, category_id, category)
        SELECT 'General', c.id, c.key
        FROM unit_categories c
        WHERE c.key = 'penghantar-gitet'
        ON CONFLICT (category_id, name) DO NOTHING
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO units (name, category_id, category)
        SELECT *
        FROM (
            SELECT 'Default Penghantar GITET'::TEXT AS name, c.id AS category_id, c.key AS category
            FROM unit_categories c
            WHERE c.key = 'penghantar-gitet'
            UNION ALL
            SELECT 'Default IBT GITET'::TEXT, c.id, c.key
            FROM unit_categories c
            WHERE c.key = 'ibt-gitet'
            UNION ALL
            SELECT 'Default Penghantar GI'::TEXT, c.id, c.key
            FROM unit_categories c
            WHERE c.key = 'penghantar-gi'
            UNION ALL
            SELECT 'Default IBT Trafo GI'::TEXT, c.id, c.key
            FROM unit_categories c
            WHERE c.key = 'ibt-trafo-gi'
        ) seeded
        ON CONFLICT (category_id, name) DO NOTHING
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS bays (
            id SERIAL PRIMARY KEY,
            unit_id INTEGER,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("ALTER TABLE bays ADD COLUMN IF NOT EXISTS unit_id INTEGER")
        .execute(pool)
        .await?;
    sqlx::query(
        r#"
        UPDATE bays
        SET unit_id = (SELECT id FROM units ORDER BY id ASC LIMIT 1)
        WHERE unit_id IS NULL
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query("ALTER TABLE bays ALTER COLUMN unit_id SET NOT NULL")
        .execute(pool)
        .await?;
    sqlx::query(
        r#"
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_bays_unit_id'
            ) THEN
                ALTER TABLE bays
                ADD CONSTRAINT fk_bays_unit_id
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("DROP INDEX IF EXISTS idx_bays_name")
        .execute(pool)
        .await?;
    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_bays_unit_name ON bays(unit_id, name)")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS bebans (
            id SERIAL PRIMARY KEY,
            bay_id INTEGER REFERENCES bays (id) ON DELETE SET NULL,
            kv DOUBLE PRECISION NOT NULL,
            a DOUBLE PRECISION NOT NULL,
            mw DOUBLE PRECISION NOT NULL,
            mvar DOUBLE PRECISION NOT NULL,
            percentage DOUBLE PRECISION NOT NULL,
            tap DOUBLE PRECISION,
            measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Keep existing environments compatible with older schema versions.
    sqlx::query("ALTER TABLE bebans ADD COLUMN IF NOT EXISTS measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
        .execute(pool)
        .await?;
    sqlx::query(
        "ALTER TABLE bebans ALTER COLUMN a TYPE DOUBLE PRECISION USING a::double precision",
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "ALTER TABLE bebans ALTER COLUMN mw TYPE DOUBLE PRECISION USING mw::double precision",
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "ALTER TABLE bebans ALTER COLUMN mvar TYPE DOUBLE PRECISION USING mvar::double precision",
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "ALTER TABLE bebans ALTER COLUMN tap TYPE DOUBLE PRECISION USING tap::double precision",
    )
    .execute(pool)
    .await?;
    sqlx::query("ALTER TABLE bebans ALTER COLUMN percentage TYPE DOUBLE PRECISION USING percentage::double precision")
        .execute(pool)
        .await?;
    sqlx::query(
        "ALTER TABLE bebans ALTER COLUMN kv TYPE DOUBLE PRECISION USING kv::double precision",
    )
    .execute(pool)
    .await?;

    Ok(())
}
