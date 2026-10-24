CREATE TABLE IF NOT EXISTS student_applications (
  reference_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  program TEXT NOT NULL,
  department TEXT NOT NULL,
  batch_season TEXT NOT NULL,
  batch_year TEXT NOT NULL,
  phone TEXT,
  facebook_url TEXT,
  doc_category TEXT,
  doc_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  current_step INTEGER NOT NULL DEFAULT 2,
  reviewed_by TEXT,
  reviewed_at TEXT,
  submitted_at TEXT NOT NULL,
  custom_fields_json TEXT
);

CREATE TABLE IF NOT EXISTS representatives (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dept_id TEXT NOT NULL,
  role TEXT NOT NULL,
  term TEXT NOT NULL,
  fb_url TEXT,
  email TEXT,
  photo_url TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rep_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rep_name TEXT,
  department TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_credentials (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO admin_credentials (username, password, role, updated_at) VALUES ('admin', 'kdu2026', 'Super Admin', datetime('now'));

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kdu_app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
