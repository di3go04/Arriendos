-- =============================================================
-- Migration: Create locations table for map dropdowns
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =============================================================

-- 1. Create the locations table
CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,
  department TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for faster filtering by country/department/city
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations (country);
CREATE INDEX IF NOT EXISTS idx_locations_department ON locations (department);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations (city);

-- 3. Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 4. Public read policy (anyone can SELECT)
CREATE POLICY "locations_select_public"
  ON locations
  FOR SELECT
  USING (true);

-- 5. Optional: restrict INSERT/UPDATE/DELETE to authenticated users with admin role
CREATE POLICY "locations_insert_admin"
  ON locations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "locations_update_admin"
  ON locations
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "locations_delete_admin"
  ON locations
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
