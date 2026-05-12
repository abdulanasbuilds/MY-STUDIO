-- MY STUDIO — 002: Avatar Schema
-- PURPOSE: Tables for Avatar Studio (M01)
-- Tables: avatar_profiles, avatar_generations

-- ============================================================================
-- 1. Avatar profiles — face + voice identity per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Avatar',
  face_image_url TEXT NOT NULL,
  face_cloudinary_id TEXT,
  voice_model_path TEXT,
  voice_cloned BOOLEAN NOT NULL DEFAULT false,
  voice_cloned_at TIMESTAMPTZ,
  is_default BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE avatar_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatars"
  ON avatar_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatars"
  ON avatar_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars"
  ON avatar_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON avatar_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_avatar_profiles_user_id ON avatar_profiles(user_id);
CREATE INDEX idx_avatar_profiles_is_default ON avatar_profiles(user_id, is_default);

-- Ensure only one default avatar per user
CREATE OR REPLACE FUNCTION ensure_single_default_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE avatar_profiles
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_avatar
  AFTER INSERT OR UPDATE OF is_default ON avatar_profiles
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_avatar();

-- ============================================================================
-- 2. Avatar generations — history of generated avatar videos
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES content_jobs(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatar_profiles(id) ON DELETE CASCADE,
  script TEXT NOT NULL,
  quality_mode TEXT NOT NULL DEFAULT 'fast'
    CHECK (quality_mode IN ('fast', 'premium')),
  caption_style TEXT NOT NULL DEFAULT 'none'
    CHECK (caption_style IN ('hormozi', 'netflix', 'tiktok', 'none')),
  language TEXT NOT NULL DEFAULT 'en',
  style TEXT DEFAULT 'casual'
    CHECK (style IN ('casual', 'professional', 'energetic', 'educational')),
  output_url TEXT,
  duration_seconds REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE avatar_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar generations"
  ON avatar_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar generations"
  ON avatar_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_avatar_generations_user_id ON avatar_generations(user_id);
CREATE INDEX idx_avatar_generations_avatar_id ON avatar_generations(avatar_id);
CREATE INDEX idx_avatar_generations_created_at ON avatar_generations(created_at DESC);

-- ============================================================================
-- Record migration
-- ============================================================================

INSERT INTO schema_migrations (migration_name)
VALUES ('002_avatar_schema')
ON CONFLICT (migration_name) DO NOTHING;
