-- ============================================================================
-- KDU Bangla Community - Cloudflare D1 Database Schema (SQLite)
-- ============================================================================
-- এই SQL ফাইলটি আপনার Cloudflare D1 Database-এ Run করুন।
-- (নোট: অ্যাপের API কোডেও Auto-Table Creation যুক্ত করা আছে, তাই DB bind করলেই অটোমেটিক কাজ করবে)

CREATE TABLE IF NOT EXISTS kdu_app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kdu_app_state_updated_at
  ON kdu_app_state(updated_at);
