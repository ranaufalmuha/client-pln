-- ============================================================================
-- MIGRATION: Old Schema → New 5-Level Hierarchy Schema
-- For: Neon DB PostgreSQL
-- ============================================================================
-- WARNING: Backup your database before running this!
-- 
-- This migration:
-- 1. Creates new tables (classifications, unit_types, beban_records)
-- 2. Migrates existing data to new structure
-- 3. Keeps old tables as backup (renamed with _old suffix)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create new classifications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS classifications (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed classifications
INSERT INTO classifications (code, name)
VALUES
    ('BEBAN', 'beban'),
    ('GANGGUAN', 'gangguan')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 2: Create new unit_types table
-- ============================================================================
CREATE TABLE IF NOT EXISTS unit_types (
    id SERIAL PRIMARY KEY,
    classification_id INTEGER NOT NULL REFERENCES classifications(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(classification_id, code),
    UNIQUE(classification_id, name)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_unit_types_classification_id ON unit_types(classification_id);

-- ============================================================================
-- STEP 3: Create new units table (new schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS units_new (
    id SERIAL PRIMARY KEY,
    unit_type_id INTEGER NOT NULL REFERENCES unit_types(id) ON DELETE RESTRICT,
    code TEXT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_type_id, name)
);

-- ============================================================================
-- STEP 4: Migrate unit_categories → unit_types
-- ============================================================================
-- Map old categories to new unit_types under BEBAN classification
INSERT INTO unit_types (classification_id, code, name)
SELECT 
    (SELECT id FROM classifications WHERE code = 'BEBAN'),
    uc.key,
    uc.name
FROM unit_categories uc
WHERE NOT EXISTS (
    SELECT 1 FROM unit_types ut 
    WHERE ut.code = uc.key 
    AND ut.classification_id = (SELECT id FROM classifications WHERE code = 'BEBAN')
)
ON CONFLICT (classification_id, code) DO NOTHING;

-- ============================================================================
-- STEP 5: Migrate units (old) → units_new
-- ============================================================================
-- Map old units to new schema with unit_type_id
INSERT INTO units_new (id, unit_type_id, code, name, created_at, updated_at)
SELECT 
    u.id,
    ut.id as unit_type_id,
    NULL as code,  -- old units don't have codes
    u.name,
    u.created_at,
    u.updated_at
FROM units u
JOIN unit_categories uc ON uc.id = u.category_id
JOIN unit_types ut ON ut.code = uc.key 
    AND ut.classification_id = (SELECT id FROM classifications WHERE code = 'BEBAN')
ON CONFLICT (id) DO UPDATE SET
    unit_type_id = EXCLUDED.unit_type_id,
    name = EXCLUDED.name;

-- Reset sequence to max id
SELECT setval('units_new_id_seq', COALESCE((SELECT MAX(id) FROM units_new), 1));

-- ============================================================================
-- STEP 6: Create new bays table (new schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bays_new (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units_new(id) ON DELETE RESTRICT,
    code TEXT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_id, name)
);

-- ============================================================================
-- STEP 7: Migrate bays → bays_new
-- ============================================================================
INSERT INTO bays_new (id, unit_id, code, name, created_at, updated_at)
SELECT 
    b.id,
    b.unit_id,
    NULL as code,  -- old bays don't have codes
    b.name,
    COALESCE(b.created_at, NOW()),
    COALESCE(b.updated_at, NOW())
FROM bays b
ON CONFLICT (id) DO UPDATE SET
    unit_id = EXCLUDED.unit_id,
    name = EXCLUDED.name;

-- Reset sequence
SELECT setval('bays_new_id_seq', COALESCE((SELECT MAX(id) FROM bays_new), 1));

-- ============================================================================
-- STEP 8: Create beban_records table
-- ============================================================================
CREATE TABLE IF NOT EXISTS beban_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    bay_id INTEGER NOT NULL REFERENCES bays_new(id) ON DELETE RESTRICT,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_beban_records_user_id ON beban_records(user_id);
CREATE INDEX IF NOT EXISTS idx_beban_records_bay_id ON beban_records(bay_id);
CREATE INDEX IF NOT EXISTS idx_beban_records_recorded_at ON beban_records(recorded_at);

-- ============================================================================
-- STEP 9: Migrate old bebans → beban_records
-- ============================================================================
-- Convert old beban data to new schema
INSERT INTO beban_records (
    id, user_id, bay_id, recorded_at, kv, current_a, mw, mvar, percentage, tap, note, created_at, updated_at
)
SELECT 
    b.id,
    1 as user_id,  -- Assign to first user (admin), adjust as needed
    COALESCE(b.bay_id, 1) as bay_id,  -- Use default bay if null
    COALESCE(
        (b.measured_at)::TIMESTAMPTZ, 
        b.created_at::TIMESTAMPTZ, 
        NOW()
    ) as recorded_at,
    COALESCE(b.kv, 0) as kv,
    COALESCE(b.a, 0) as current_a,
    COALESCE(b.mw, 0) as mw,
    COALESCE(b.mvar, 0) as mvar,
    COALESCE(b.percentage, 0) as percentage,
    b.tap,
    NULL as note,
    COALESCE(b.created_at::TIMESTAMPTZ, NOW()) as created_at,
    COALESCE(b.updated_at::TIMESTAMPTZ, NOW()) as updated_at
FROM bebans b
WHERE b.bay_id IS NOT NULL  -- Only migrate records with valid bay
ON CONFLICT (id) DO UPDATE SET
    recorded_at = EXCLUDED.recorded_at,
    kv = EXCLUDED.kv,
    current_a = EXCLUDED.current_a,
    mw = EXCLUDED.mw,
    mvar = EXCLUDED.mvar,
    percentage = EXCLUDED.percentage;

-- Reset sequence
SELECT setval('beban_records_id_seq', COALESCE((SELECT MAX(id) FROM beban_records), 1));

-- ============================================================================
-- STEP 10: Rename tables (keep old as backup)
-- ============================================================================
-- Only run these if migration was successful!
-- Uncomment when ready:

-- ALTER TABLE unit_categories RENAME TO unit_categories_old;
-- ALTER TABLE units RENAME TO units_old;
-- ALTER TABLE bays RENAME TO bays_old;
-- ALTER TABLE bebans RENAME TO bebans_old;

-- ALTER TABLE units_new RENAME TO units;
-- ALTER TABLE bays_new RENAME TO bays;

-- ============================================================================
-- STEP 11: Verify migration
-- ============================================================================
-- Show counts for verification
SELECT 'classifications' as table_name, COUNT(*) as count FROM classifications
UNION ALL
SELECT 'unit_types', COUNT(*) FROM unit_types
UNION ALL
SELECT 'units_new', COUNT(*) FROM units_new
UNION ALL
SELECT 'bays_new', COUNT(*) FROM bays_new
UNION ALL
SELECT 'beban_records', COUNT(*) FROM beban_records
UNION ALL
SELECT 'unit_categories (old)', COUNT(*) FROM unit_categories
UNION ALL
SELECT 'units (old)', COUNT(*) FROM units
UNION ALL
SELECT 'bays (old)', COUNT(*) FROM bays
UNION ALL
SELECT 'bebans (old)', COUNT(*) FROM bebans;

COMMIT;
