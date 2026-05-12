-- MY STUDIO — 001: Core Schema
-- PURPOSE: Foundation tables for all modules
-- Tables: schema_migrations, user_profiles, content_jobs, content_library, workflows, content_presets

-- ============================================================================
-- 1. Schema migrations tracker
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. User profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 3. Content jobs — central job tracking for all modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  current_step TEXT NOT NULL DEFAULT 'initializing',
  progress_percent INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  input_type TEXT NOT NULL DEFAULT 'text',
  input_data JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  output_url TEXT,
  output_metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE content_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON content_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON content_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON content_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_content_jobs_user_id ON content_jobs(user_id);
CREATE INDEX idx_content_jobs_status ON content_jobs(status);
CREATE INDEX idx_content_jobs_module ON content_jobs(module);
CREATE INDEX idx_content_jobs_created_at ON content_jobs(created_at DESC);
CREATE INDEX idx_content_jobs_user_status ON content_jobs(user_id, status);

-- ============================================================================
-- 4. Content library — finished outputs across all modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES content_jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  module TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds REAL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own library items"
  ON content_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own library items"
  ON content_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own library items"
  ON content_library FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_content_library_user_id ON content_library(user_id);
CREATE INDEX idx_content_library_module ON content_library(module);
CREATE INDEX idx_content_library_created_at ON content_library(created_at DESC);

-- ============================================================================
-- 5. Workflows — visual pipeline definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Workflow',
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflows"
  ON workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON workflows FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);

-- ============================================================================
-- 6. Content presets — saved settings per module
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presets"
  ON content_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets"
  ON content_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON content_presets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON content_presets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_content_presets_user_id ON content_presets(user_id);
CREATE INDEX idx_content_presets_module ON content_presets(module);

-- ============================================================================
-- Updated-at trigger function (reused across tables)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Record migration
-- ============================================================================

INSERT INTO schema_migrations (migration_name)
VALUES ('001_core_schema')
ON CONFLICT (migration_name) DO NOTHING;
