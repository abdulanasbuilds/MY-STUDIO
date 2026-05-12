-- MY STUDIO — 003: Clipper Schema
-- PURPOSE: Tables for Smart Clipper (M11)
-- Tables: content_clips

-- ============================================================================
-- 1. Content clips — viral clips extracted from long-form content
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_job_id UUID REFERENCES content_jobs(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  start_seconds REAL NOT NULL DEFAULT 0,
  end_seconds REAL NOT NULL DEFAULT 0,
  duration_seconds REAL NOT NULL DEFAULT 0,

  -- Viral scoring (12 signals)
  viral_score REAL NOT NULL DEFAULT 0
    CHECK (viral_score >= 0 AND viral_score <= 100),
  hook_strength REAL NOT NULL DEFAULT 0
    CHECK (hook_strength >= 0 AND hook_strength <= 100),
  signal_breakdown JSONB NOT NULL DEFAULT '{}',

  -- Content analysis
  transcript TEXT NOT NULL DEFAULT '',
  hook_text TEXT,
  generated_titles TEXT[] NOT NULL DEFAULT '{}',
  generated_hashtags JSONB NOT NULL DEFAULT '{}',

  -- Platform-specific exports
  file_tiktok_url TEXT,
  file_reels_url TEXT,
  file_shorts_url TEXT,
  file_twitter_url TEXT,
  file_linkedin_url TEXT,

  -- Settings
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'exported', 'failed')),
  caption_style TEXT NOT NULL DEFAULT 'tiktok'
    CHECK (caption_style IN ('hormozi', 'netflix', 'tiktok', 'none')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips"
  ON content_clips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clips"
  ON content_clips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clips"
  ON content_clips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clips"
  ON content_clips FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_content_clips_user_id ON content_clips(user_id);
CREATE INDEX idx_content_clips_viral_score ON content_clips(viral_score DESC);
CREATE INDEX idx_content_clips_created_at ON content_clips(created_at DESC);
CREATE INDEX idx_content_clips_source_job ON content_clips(source_job_id);

-- ============================================================================
-- Record migration
-- ============================================================================

INSERT INTO schema_migrations (migration_name)
VALUES ('003_clipper_schema')
ON CONFLICT (migration_name) DO NOTHING;
