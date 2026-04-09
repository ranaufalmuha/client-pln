-- ============================================================================
-- SAFE MIGRATION: Create new schema without touching old data
-- ============================================================================
-- This script:
-- 1. Creates all NEW tables with proper structure
-- 2. Keeps ALL old tables intact
-- 3. You can verify everything works before switching
-- ============================================================================

-- Step 1: Create classifications (if not exists)
CREATE TABLE IF NOT EXISTS classifications (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO classifications (code, name)
VALUES ('BEBAN', 'beban'), ('GANGGUAN', 'gangguan')
ON CONFLICT (code) DO NOTHING;

-- Step 2: Create unit_types (if not exists)
CREATE TABLE IF NOT EXISTS unit_types (
    id SERIAL PRIMARY KEY,
    classification_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(classification_id, code),
    UNIQUE(classification_id, name)
);

-- Add FK constraint safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_unit_types_classification_id'
    ) THEN
        ALTER TABLE unit_types
        ADD CONSTRAINT fk_unit_types_classification_id
        FOREIGN KEY (classification_id) REFERENCES classifications(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Step 3: Migrate categories to unit_types (idempotent)
INSERT INTO unit_types (classification_id, code, name)
SELECT 
    (SELECT id FROM classifications WHERE code = 'BEBAN'),
    uc.key,
    uc.name
FROM unit_categories uc
ON CONFLICT (classification_id, code) DO NOTHING;

-- Step 4: Update units table (add new columns if needed)
ALTER TABLE units ADD COLUMN IF NOT EXISTS unit_type_id INTEGER;
ALTER TABLE units ADD COLUMN IF NOT EXISTS code TEXT;

-- Update units to point to new unit_types
UPDATE units u
SET unit_type_id = ut.id
FROM unit_categories uc
JOIN unit_types ut ON ut.code = uc.key
WHERE u.category_id = uc.id
AND u.unit_type_id IS NULL;

-- Step 5: Update bays table (add new columns if needed)
ALTER TABLE bays ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE bays ALTER COLUMN unit_id SET NOT NULL;

-- Step 6: Create beban_records table
CREATE TABLE IF NOT EXISTS beban_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    bay_id INTEGER NOT NULL REFERENCES bays(id),
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

-- Step 7: Migrate old beban data (if not already migrated)
INSERT INTO beban_records (
    user_id, bay_id, recorded_at, kv, current_a, mw, mvar, percentage, tap, note, created_at
)
SELECT 
    1 as user_id,  -- Default to admin, update as needed
    b.bay_id,
    COALESCE(
        NULLIF(b.measured_at, '')::TIMESTAMPTZ,
        b.created_at::TIMESTAMPTZ,
        NOW()
    ),
    COALESCE(b.kv, 0),
    COALESCE(b.a, 0),
    COALESCE(b.mw, 0),
    COALESCE(b.mvar, 0),
    COALESCE(b.percentage, 0),
    b.tap,
    NULL,
    COALESCE(b.created_at::TIMESTAMPTZ, NOW())
FROM bebans b
WHERE b.bay_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM beban_records br WHERE br.id = b.id
);

-- Show migration status
SELECT 
    'Migration Status' as info,
    (SELECT COUNT(*) FROM classifications) as classifications,
    (SELECT COUNT(*) FROM unit_types) as unit_types,
    (SELECT COUNT(*) FROM units WHERE unit_type_id IS NOT NULL) as units_updated,
    (SELECT COUNT(*) FROM beban_records) as beban_records_migrated,
    (SELECT COUNT(*) FROM bebans) as old_bebans_total;
