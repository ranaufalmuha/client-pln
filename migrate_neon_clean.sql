-- ============================================================================
-- CLEAN MIGRATION: Fresh Schema (No code columns)
-- ============================================================================
-- WARNING: This DESTROYS all existing data!
-- ============================================================================

-- Step 1: Drop everything
DROP TABLE IF EXISTS beban_records CASCADE;
DROP TABLE IF EXISTS bays CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS unit_types CASCADE;
DROP TABLE IF EXISTS classifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS classifications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS unit_types_id_seq CASCADE;
DROP SEQUENCE IF EXISTS units_id_seq CASCADE;
DROP SEQUENCE IF EXISTS bays_id_seq CASCADE;
DROP SEQUENCE IF EXISTS beban_records_id_seq CASCADE;

-- ============================================================================
-- Step 2: Create clean schema (NO code columns)
-- ============================================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classifications table (only name, no code needed)
CREATE TABLE classifications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed classifications
INSERT INTO classifications (name) VALUES
    ('beban'),
    ('gangguan');

-- Unit types table (NO code column)
CREATE TABLE unit_types (
    id SERIAL PRIMARY KEY,
    classification_id INTEGER NOT NULL REFERENCES classifications(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(classification_id, name)
);

CREATE INDEX idx_unit_types_classification_id ON unit_types(classification_id);

-- Seed unit_types for beban
INSERT INTO unit_types (classification_id, name)
SELECT c.id, 'GI 150/70kV'
FROM classifications c
WHERE c.name = 'beban';

INSERT INTO unit_types (classification_id, name)
SELECT c.id, 'GITET 500kV'
FROM classifications c
WHERE c.name = 'beban';

-- Units table (NO code column)
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    unit_type_id INTEGER NOT NULL REFERENCES unit_types(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_type_id, name)
);

CREATE INDEX idx_units_unit_type_id ON units(unit_type_id);

-- Seed units
INSERT INTO units (unit_type_id, name)
SELECT ut.id, 'IBT/Trafo GI'
FROM unit_types ut
JOIN classifications c ON c.id = ut.classification_id
WHERE c.name = 'beban' AND ut.name = 'GI 150/70kV';

INSERT INTO units (unit_type_id, name)
SELECT ut.id, 'Penghantar GITET'
FROM unit_types ut
JOIN classifications c ON c.id = ut.classification_id
WHERE c.name = 'beban' AND ut.name = 'GITET 500kV';

-- Bays table (NO code column)
CREATE TABLE bays (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_id, name)
);

CREATE INDEX idx_bays_unit_id ON bays(unit_id);

-- Seed bays
INSERT INTO bays (unit_id, name)
SELECT u.id, 'IBT 1 150/70 kV'
FROM units u
JOIN unit_types ut ON ut.id = u.unit_type_id
JOIN classifications c ON c.id = ut.classification_id
WHERE c.name = 'beban' AND ut.name = 'GI 150/70kV' AND u.name = 'IBT/Trafo GI';

INSERT INTO bays (unit_id, name)
SELECT u.id, 'Depok 1'
FROM units u
JOIN unit_types ut ON ut.id = u.unit_type_id
JOIN classifications c ON c.id = ut.classification_id
WHERE c.name = 'beban' AND ut.name = 'GITET 500kV' AND u.name = 'Penghantar GITET';

-- Beban records table
CREATE TABLE beban_records (
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
);

-- Indexes
CREATE INDEX idx_beban_records_user_id ON beban_records(user_id);
CREATE INDEX idx_beban_records_bay_id ON beban_records(bay_id);
CREATE INDEX idx_beban_records_recorded_at ON beban_records(recorded_at);

-- ============================================================================
-- Step 3: Verify
-- ============================================================================
SELECT 'Tables created:' as status;
SELECT 
    'classifications: ' || COUNT(*) as count FROM classifications
UNION ALL
SELECT 'unit_types: ' || COUNT(*) FROM unit_types
UNION ALL
SELECT 'units: ' || COUNT(*) FROM units
UNION ALL
SELECT 'bays: ' || COUNT(*) FROM bays;
