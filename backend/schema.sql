-- CREATE TABLE IF NOT EXISTS tenants (
--   id TEXT PRIMARY KEY,
--   name TEXT NOT NULL,
--   logo_url TEXT,
--   primary_color TEXT DEFAULT '#14b8a6',
--   subscription_tier TEXT DEFAULT 'basic',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS users (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT REFERENCES tenants(id),
--   email TEXT UNIQUE NOT NULL,
--   password_hash TEXT NOT NULL,
--   role TEXT CHECK(role IN ('platform_admin', 'tenant_admin', 'sales_rep')) NOT NULL,
--   name TEXT,
--   phone TEXT,
--   force_password_change INTEGER DEFAULT 0
-- );

-- CREATE TABLE IF NOT EXISTS equipment (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT REFERENCES tenants(id),
--   name TEXT NOT NULL,
--   category TEXT,
--   width REAL,
--   depth REAL,
--   height REAL,
--   color TEXT,
--   model_url TEXT,
--   animations_enabled BOOLEAN DEFAULT FALSE,
--   image_url TEXT,
--   is_active BOOLEAN DEFAULT TRUE
-- );

-- CREATE TABLE IF NOT EXISTS projects (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT REFERENCES tenants(id),
--   user_id TEXT REFERENCES users(id),
--   name TEXT NOT NULL,
--   data TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS password_reset_requests (
--   id TEXT PRIMARY KEY,
--   user_id TEXT NOT NULL REFERENCES users(id),
--   email TEXT NOT NULL,
--   status TEXT DEFAULT 'pending',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS activity_logs (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT,
--   user_id TEXT NOT NULL,
--   user_name TEXT NOT NULL,
--   action TEXT NOT NULL,
--   entity_type TEXT NOT NULL,
--   entity_name TEXT,
--   details TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS tenant_disabled_defaults (
--   tenant_id TEXT NOT NULL REFERENCES tenants(id),
--   equipment_id TEXT NOT NULL,
--   PRIMARY KEY (tenant_id, equipment_id)
-- );

-- CREATE TABLE IF NOT EXISTS platform_admin_otps (
--   id TEXT PRIMARY KEY,
--   user_id TEXT NOT NULL REFERENCES users(id),
--   email TEXT NOT NULL,
--   otp TEXT NOT NULL,
--   expires_at TEXT NOT NULL,
--   used BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS login_attempts (
--   id TEXT PRIMARY KEY,
--   user_id TEXT NOT NULL REFERENCES users(id),
--   email TEXT NOT NULL,
--   failed_count INTEGER DEFAULT 1,
--   last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
--   is_locked BOOLEAN DEFAULT FALSE,
--   locked_at TIMESTAMPTZ,
--   locked_by_role TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS locked_accounts (
--   id TEXT PRIMARY KEY,
--   user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
--   email TEXT NOT NULL,
--   user_role TEXT NOT NULL,
--   locked_at TIMESTAMPTZ DEFAULT NOW(),
--   reason TEXT DEFAULT 'Too many failed login attempts',
--   can_unlock_by_roles TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- -- User status: active | inactive | archived
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- -- Migrate existing is_active values into status (safe to run multiple times)
-- UPDATE users SET status = 'inactive' WHERE is_active = FALSE AND (status IS NULL OR status = 'active');
-- UPDATE users SET status = 'active' WHERE status IS NULL;

-- -- Fix FK constraints to allow user deletion without breaking projects
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
-- ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- -- Fix #7: unique phone per tenant (NULL phones are allowed and not counted as duplicates)
-- CREATE UNIQUE INDEX IF NOT EXISTS users_phone_tenant_unique
--   ON users (phone, tenant_id)
--   WHERE phone IS NOT NULL AND phone != '';

-- -- Compliance Engine: exactly one "latest" report per project. Stored as
-- -- TEXT (JSON-stringified), matching how projects.data is already stored —
-- -- every Compliance Engine run overwrites this same column, it is never
-- -- inserted as a new row, so there is only ever one report per project.
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS compliance_report TEXT;
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS compliance_report_generated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#14b8a6',
  subscription_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('platform_admin', 'tenant_admin', 'sales_rep')) NOT NULL,
  name TEXT,
  phone TEXT,
  force_password_change INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  name TEXT NOT NULL,
  category TEXT,
  width REAL,
  depth REAL,
  height REAL,
  color TEXT,
  model_url TEXT,
  animations_enabled BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_disabled_defaults (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  equipment_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS platform_admin_otps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  failed_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  locked_by_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locked_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT DEFAULT 'Too many failed login attempts',
  can_unlock_by_roles TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- User status: active | inactive | archived
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- Migrate existing is_active values into status (safe to run multiple times)
UPDATE users SET status = 'inactive' WHERE is_active = FALSE AND (status IS NULL OR status = 'active');
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Fix FK constraints to allow user deletion without breaking projects
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Fix #7: unique phone per tenant (NULL phones are allowed and not counted as duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_tenant_unique
  ON users (phone, tenant_id)
  WHERE phone IS NOT NULL AND phone != '';

-- ─── Compliance Report versioning ──────────────────────────────────────────
-- Superseded design: an earlier iteration stored the "latest" report as two
-- columns directly on projects (compliance_report, compliance_report_generated_at).
-- That only supported one report per project with no history, so it has been
-- replaced by the compliance_reports table below. Dropping is safe: these
-- columns were added in the same development cycle as this change and never
-- shipped to end users.
ALTER TABLE projects DROP COLUMN IF EXISTS compliance_report;
ALTER TABLE projects DROP COLUMN IF EXISTS compliance_report_generated_at;

-- Every Compliance Engine execution inserts a new row here rather than
-- overwriting anything — this is the permanent version history for a
-- project's compliance reports. Exactly one row per project is ever
-- flagged is_latest = TRUE; the partial unique index below enforces that
-- invariant at the database level (not just in application code).
CREATE TABLE IF NOT EXISTS compliance_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  overall_score REAL,
  status TEXT,
  summary TEXT,
  violations TEXT,        -- JSON-stringified checks[] (category/status/message/details)
  recommendations TEXT,   -- JSON-stringified string[]
  report_data TEXT NOT NULL, -- full JSON blob of the report, for forward compatibility
  is_latest BOOLEAN DEFAULT FALSE,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS compliance_reports_project_id_idx
  ON compliance_reports (project_id);

-- Guarantees "exactly one latest report per project" even under concurrent
-- writes — a second concurrent INSERT trying to also set is_latest = TRUE
-- for the same project_id would violate this index and fail, rather than
-- silently leaving two "latest" rows.
CREATE UNIQUE INDEX IF NOT EXISTS compliance_reports_one_latest_per_project
  ON compliance_reports (project_id)
  WHERE is_latest = TRUE;