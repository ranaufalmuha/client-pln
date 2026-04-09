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

    // Classifications table (NO code column)
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS classifications (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        ",
    )
    .execute(pool)
    .await?;

    // Seed classifications (lowercase)
    sqlx::query(
        "
        INSERT INTO classifications (name)
        VALUES
            ('beban'),
            ('gangguan')
        ON CONFLICT (name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Unit types table (NO code column)
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS unit_types (
            id SERIAL PRIMARY KEY,
            classification_id INTEGER NOT NULL REFERENCES classifications(id) ON DELETE RESTRICT,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(classification_id, name)
        )
        ",
    )
    .execute(pool)
    .await?;

    // Seed unit_types for beban
    sqlx::query(
        "
        INSERT INTO unit_types (classification_id, name)
        SELECT c.id, 'GI 150/70kV'
        FROM classifications c
        WHERE c.name = 'beban'
        ON CONFLICT (classification_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO unit_types (classification_id, name)
        SELECT c.id, 'GITET 500kV'
        FROM classifications c
        WHERE c.name = 'beban'
        ON CONFLICT (classification_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Units table (NO code column)
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS units (
            id SERIAL PRIMARY KEY,
            unit_type_id INTEGER NOT NULL REFERENCES unit_types(id) ON DELETE RESTRICT,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(unit_type_id, name)
        )
        ",
    )
    .execute(pool)
    .await?;

    // Seed units
    sqlx::query(
        "
        INSERT INTO units (unit_type_id, name)
        SELECT ut.id, 'IBT/Trafo GI'
        FROM unit_types ut
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.name = 'beban' AND ut.name = 'GI 150/70kV'
        ON CONFLICT (unit_type_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO units (unit_type_id, name)
        SELECT ut.id, 'Penghantar GITET'
        FROM unit_types ut
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.name = 'beban' AND ut.name = 'GITET 500kV'
        ON CONFLICT (unit_type_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    // Bays table (NO code column)
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS bays (
            id SERIAL PRIMARY KEY,
            unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(unit_id, name)
        )
        ",
    )
    .execute(pool)
    .await?;

    // Seed bays
    sqlx::query(
        "
        INSERT INTO bays (unit_id, name)
        SELECT u.id, 'IBT 1 150/70 kV'
        FROM units u
        JOIN unit_types ut ON ut.id = u.unit_type_id
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.name = 'beban' AND ut.name = 'GI 150/70kV' AND u.name = 'IBT/Trafo GI'
        ON CONFLICT (unit_id, name) DO NOTHING
        ",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO bays (unit_id, name)
        SELECT u.id, 'Depok 1'
        FROM units u
        JOIN unit_types ut ON ut.id = u.unit_type_id
        JOIN classifications c ON c.id = ut.classification_id
        WHERE c.name = 'beban' AND ut.name = 'GITET 500kV' AND u.name = 'Penghantar GITET'
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
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            bay_id INTEGER NOT NULL REFERENCES bays(id) ON DELETE RESTRICT,
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

    // Indexes
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

    Ok(())
}
