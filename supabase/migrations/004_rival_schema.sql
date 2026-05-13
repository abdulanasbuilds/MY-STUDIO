c-- MY STUDIO — 004: Rival Schema
-- PURPOSE: Tables for Rival Intelligence (M06) and Competitor Spy (M14)
-- Tables: rival_profiles, rival_posts, content_remixes

-- ============================================================================
-- 1. Rival profiles — competitors being monitored
-- ============================================================================

CREATE TABLE IF NOT EXISTS rival_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL
    CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'twitter')),
  profile_url TEXT NOT NULL,
  username TEXT NOT NULL,
  follower_count INTEGER,
  monitoring_active BOOLEAN NOT NULL DEFAULT true,
  analysis_data JSONB,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rival_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rivals"
  ON rival_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rivals"
  ON rival_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rivals"
  ON rival_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rivals"
  ON rival_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_rival_profiles_user_id ON rival_profiles(user_id);
CREATE INDEX idx_rival_profiles_platform ON rival_profiles(platform);
CREATE INDEX idx_rival_profiles_monitoring ON rival_profiles(monitoring_active)
  WHERE monitoring_active = true;

-- ============================================================================
-- 2. Rival posts — individual posts from monitored competitors
-- ============================================================================

CREATE TABLE IF NOT EXISTS rival_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rival_id UUID NOT NULL REFERENCES rival_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  caption TEXT,

  -- Engagement metrics
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate REAL NOT NULL DEFAULT 0,
  views_per_hour REAL NOT NULL DEFAULT 0,

  -- Analysis
  is_viral BOOLEAN NOT NULL DEFAULT false,
  is_popping_off BOOLEAN NOT NULL DEFAULT false,
  viral_score REAL NOT NULL DEFAULT 0
    CHECK (viral_score >= 0 AND viral_score <= 100),
  why_it_worked TEXT,
  hook_type TEXT,

  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rival_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rival posts"
  ON rival_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rival posts"
  ON rival_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rival_posts_rival_id ON rival_posts(rival_id);
CREATE INDEX idx_rival_posts_user_id ON rival_posts(user_id);
CREATE INDEX idx_rival_posts_viral_score ON rival_posts(viral_score DESC);
CREATE INDEX idx_rival_posts_is_viral ON rival_posts(is_viral) WHERE is_viral = true;
CREATE INDEX idx_rival_posts_discovered_at ON rival_posts(discovered_at DESC);

-- ============================================================================
-- 3. Content remixes — remix analysis and generated scripts
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_remixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'video',

  -- Analysis
  why_it_worked TEXT NOT NULL DEFAULT '',
  hook_type TEXT,
  story_arc TEXT,
  viral_triggers TEXT[] NOT NULL DEFAULT '{}',
  pacing_analysis JSONB,
  viral_score REAL NOT NULL DEFAULT 0
    CHECK (viral_score >= 0 AND viral_score <= 100),

  -- Generated remix scripts (3 variations)
  remix_script_v1 TEXT,
  remix_script_v2 TEXT,
  remix_script_v3 TEXT,

  -- Context
  user_niche TEXT NOT NULL DEFAULT '',
  user_audience TEXT NOT NULL DEFAULT '',
  remix_goal TEXT NOT NULL DEFAULT 'same_topic'
    CHECK (remix_goal IN ('same_topic', 'extract_structure', 'counter_narrative', 'expand_point')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_remixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own remixes"
  ON content_remixes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own remixes"
  ON content_remixes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own remixes"
  ON content_remixes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_content_remixes_user_id ON content_remixes(user_id);
CREATE INDEX idx_content_remixes_created_at ON content_remixes(created_at DESC);

-- ============================================================================
-- Record migration
-- ============================================================================

INSERT INTO schema_migrations (migration_name)
VALUES ('004_rival_schema')
ON CONFLICT (migration_name) DO NOTHING;
