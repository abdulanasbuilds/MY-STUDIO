-- MY STUDIO — 005: Viral DB Schema
-- PURPOSE: Shared library of viral content for Viral Database (M13)
-- Tables: viral_content
-- NOTE: This table uses a service-role policy for inserts (workers write data)
--       and user-level SELECT for reading. No user_id column — shared data.

-- ============================================================================
-- 1. Viral content — global viral content discovered by workers
-- ============================================================================

CREATE TABLE IF NOT EXISTS viral_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source info
  platform TEXT NOT NULL
    CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'twitter')),
  content_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL DEFAULT '',
  creator_handle TEXT NOT NULL DEFAULT '',
  creator_followers INTEGER NOT NULL DEFAULT 0,
  niches TEXT[] NOT NULL DEFAULT '{}',

  -- Engagement metrics
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate REAL NOT NULL DEFAULT 0,
  views_per_hour REAL NOT NULL DEFAULT 0,

  -- Analysis
  hook_type TEXT,
  viral_triggers TEXT[] NOT NULL DEFAULT '{}',
  transcript_preview TEXT,
  full_analysis JSONB,
  viral_score REAL NOT NULL DEFAULT 0
    CHECK (viral_score >= 0 AND viral_score <= 100),

  -- Discovery metadata
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_number INTEGER NOT NULL DEFAULT 0,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  trend_score REAL NOT NULL DEFAULT 0,

  -- Deduplicate by URL
  CONSTRAINT viral_content_url_unique UNIQUE (content_url)
);

ALTER TABLE viral_content ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read viral content (shared resource)
CREATE POLICY "Authenticated users can view viral content"
  ON viral_content FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (workers use service role key)
-- No INSERT/UPDATE policies for regular users

CREATE INDEX idx_viral_content_platform ON viral_content(platform);
CREATE INDEX idx_viral_content_viral_score ON viral_content(viral_score DESC);
CREATE INDEX idx_viral_content_discovered_at ON viral_content(discovered_at DESC);
CREATE INDEX idx_viral_content_is_trending ON viral_content(is_trending)
  WHERE is_trending = true;
CREATE INDEX idx_viral_content_week ON viral_content(week_number DESC);
CREATE INDEX idx_viral_content_niches ON viral_content USING GIN (niches);

-- ============================================================================
-- Record migration
-- ============================================================================

INSERT INTO schema_migrations (migration_name)
VALUES ('005_viral_db_schema')
ON CONFLICT (migration_name) DO NOTHING;
