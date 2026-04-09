use sqlx::PgPool;

pub async fn ensure_schema(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Users table
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
    )
    .execute(pool)
    .await?;

    // Classifications table (top level: beban, gangguan)
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS classifications (
            id SERIAL PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        ",
    )
    .execute(pool)
    .await?;

    // Seed classifications
    sqlx::query(
        "
        INSERT INTO classifications (code, name)
        VALUES
            ('BEBAN', 'beban'),
            ('GANGGUAN', 'gangguan')
        ON CONFLICT (code) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Unit types table
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS unit_types (
            id SERIAL PRIMARY KEY,
            classification_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(classification_id, code),
            UNIQUE(classification_id, name)
        )
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_unit_types_classification_id'
            ) THEN
                ALTER TABLE unit_types
                ADD CONSTRAINT fk_unit_types_classification_id
                FOREIGN KEY (classification_id) REFERENCES classifications(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        ",
    )
    .execute(pool)
    .await?;

    // Seed unit_types for beban classification
    sqlx::query(
        "
        INSERT INTO unit_types (classification_id, code, name)
        SELECT c.id, 'GI_150_70', 'GI 150/70kV'
        FROM classifications c
        WHERE c.code = 'BEBAN'
        ON CONFLICT (classification_id, code) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO unit_types (classification_id, code, name)
        SELECT c.id, 'GITET_500', 'GITET 500kV'
        FROM classifications c
        WHERE c.code = 'BEBAN'
        ON CONFLICT (classification_id, code) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Units table
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS units (
            id SERIAL PRIMARY KEY,
            unit_type_id INTEGER NOT NULL,
            code TEXT,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(unit_type_id, name)
        )
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_units_unit_type_id'
            ) THEN
                ALTER TABLE units
                ADD CONSTRAINT fk_units_unit_type_id
                FOREIGN KEY (unit_type_id) REFERENCES unit_types(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        ",
    )
    .execute(pool)
    .await?;

    // Seed units
    sqlx::query(
        "
        INSERT INTO units (unit_type_id, code, name)
        SELECT ut.id, 'IBT_TRAFO_GI', 'IBT/Trafo GI'
        FROM unit_types ut
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.code = 'BEBAN' AND ut.code = 'GI_150_70'
        ON CONFLICT (unit_type_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO units (unit_type_id, code, name)
        SELECT ut.id, 'PENGHANTAR_GITET', 'Penghantar GITET'
        FROM unit_types ut
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.code = 'BEBAN' AND ut.code = 'GITET_500'
        ON CONFLICT (unit_type_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Bays table
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS bays (
            id SERIAL PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            code TEXT,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(unit_id, name)
        )
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_bays_unit_id'
            ) THEN
                ALTER TABLE bays
                ADD CONSTRAINT fk_bays_unit_id
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        ",
    )
    .execute(pool)
    .await?;

    // Seed bays
    sqlx::query(
        "
        INSERT INTO bays (unit_id, code, name)
        SELECT u.id, 'IBT1', 'IBT 1 150/70 kV'
        FROM units u
        JOIN unit_types ut ON ut.id = u.unit_type_id
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.code = 'BEBAN' AND ut.code = 'GI_150_70' AND u.name = 'IBT/Trafo GI'
        ON CONFLICT (unit_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO bays (unit_id, code, name)
        SELECT u.id, 'DEPOK1', 'Depok 1'
        FROM units u
        JOIN unit_types ut ON ut.id = u.unit_type_id
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.code = 'BEBAN' AND ut.code = 'GITET_500' AND u.name = 'Penghantar GITET'
        ON CONFLICT (unit_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Beban records table
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS beban_records (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            bay_id INTEGER NOT NULL,
            recorded_at TIMESTAMPTZ NOT NULL,
            kv FLOAT NOT NULL,
            current_a FLOAT NOT NULL,
            mw FLOAT NOT NULL,
            mvar FLOAT NOT NULL,
            percentage FLOAT NOT NULL,
            tap FLOAT,
            note TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_beban_records_user_id'
            ) THEN
                ALTER TABLE beban_records
                ADD CONSTRAINT fk_beban_records_user_id
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_beban_records_bay_id'
            ) THEN
                ALTER TABLE beban_records
                ADD CONSTRAINT fk_beban_records_bay_id
                FOREIGN KEY (bay_id) REFERENCES bays(id) ON DELETE RESTRICT;
            END IF;
        END
        $$;
        ",
    )
    .execute(pool)
    .await?;

    // Indexes for beban records
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_beban_records_user_id ON beban_records(user_id)"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_beban_records_bay_id ON beban_records(bay_id)"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_beban_records_recorded_at ON beban_records(recorded_at)"
    )
    .execute(pool)
    .await?;

    // Migrate old data if exists
    migrate_old_data(pool).await?;

    Ok(())
}

async fn migrate_old_data(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Drop old tables if they exist (after data migration)
    // This is a one-time cleanup for the old schema
    
    // Check if old bebans table exists
    let old_table_exists: bool = sqlx::query_scalar(
        "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'bebans'
        )
        "
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false);

    if old_table_exists {
        // Migrate data from old bebans to new beban_records
        // This is idempotent - safe to run multiple times
        sqlx::query(
            "
            INSERT INTO beban_records (user_id, bay_id, recorded_at, kv, current_a, mw, mvar, percentage, tap, note, created_at, updated_at)
            SELECT 
                1 as user_id,  -- Default to first user, adjust as needed
                b.id as bay_id,
                COALESCE(measured_at, NOW()) as recorded_at,
                COALESCE(kv, 0) as kv,
                COALESCE(a, 0) as current_a,
                COALESCE(mw, 0) as mw,
                COALESCE(mvar, 0) as mvar,
                COALESCE(percentage, 0) as percentage,
                tap,
                NULL as note,
                created_at,
                updated_at
            FROM beban_records_old be
            JOIN bays b ON b.id = be.bay_id
            ON CONFLICT DO NOTHING
            "
        )
        .execute(pool)
        .await?;
    }

    Ok(())
}
