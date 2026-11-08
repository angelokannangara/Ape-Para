-- Ape Para (අපේ පාර) — PostgreSQL 14+ / PostGIS 3+
-- Idempotent: safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'field_worker', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE department_type AS ENUM ('municipal', 'ceb', 'water_board');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM
    ('pothole', 'garbage_dumping', 'broken_street_light', 'drainage_block');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM
    ('submitted', 'in_review', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------- departments
CREATE TABLE IF NOT EXISTS departments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  type           department_type NOT NULL,
  contact_email  TEXT,
  region_polygon GEOMETRY(MultiPolygon, 4326) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT departments_polygon_valid CHECK (ST_IsValid(region_polygon))
);
CREATE INDEX IF NOT EXISTS departments_region_gix ON departments USING GIST (region_polygon);
CREATE INDEX IF NOT EXISTS departments_type_idx   ON departments (type);

-- ---------------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          user_role NOT NULL DEFAULT 'citizen',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_field_worker_needs_department
    CHECK (role <> 'field_worker' OR department_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_department_idx ON users (department_id);

-- -------------------------------------------------------------------- reports
CREATE TABLE IF NOT EXISTS reports (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                  TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description            TEXT NOT NULL CHECK (char_length(description) BETWEEN 5 AND 2000),
  category               report_category NOT NULL,
  status                 report_status NOT NULL DEFAULT 'submitted',
  location               GEOGRAPHY(POINT, 4326) NOT NULL,
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  routing_method         TEXT NOT NULL DEFAULT 'unrouted'
                         CHECK (routing_method IN ('polygon', 'nearest', 'manual', 'unrouted')),
  image_url              TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_location_gix   ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS reports_user_idx       ON reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_department_idx ON reports (assigned_department_id, status);
CREATE INDEX IF NOT EXISTS reports_status_idx     ON reports (status);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------- notifications (dashboard bell)
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id  UUID REFERENCES reports(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
