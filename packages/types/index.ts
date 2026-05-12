/**
 * @my-studio/types — Shared TypeScript types for MY STUDIO
 *
 * Named exports only. No runtime code — pure type definitions.
 */

// ---------------------------------------------------------------------------
// Core enums / unions
// ---------------------------------------------------------------------------

/** Lowercase module identifier used throughout the app and database. */
export type Module =
  | 'avatar'
  | 'movie'
  | 'documentary'
  | 'editor'
  | 'remix'
  | 'rivals'
  | 'news'
  | 'workflow'
  | 'audio'
  | 'thumbnails'
  | 'clipper'
  | 'remixer'
  | 'viral-db'
  | 'spy'
  | 'dubbing'
  | 'human-feel';

/** Lifecycle status of a generation job. */
export type JobStatus = 'queued' | 'processing' | 'complete' | 'failed';

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface ContentJob {
  id: string;
  user_id: string;
  module: Module;
  status: JobStatus;
  current_step: string;
  progress_percent: number;
  input_type: string;
  input_data: Record<string, unknown>;
  settings: Record<string, unknown>;
  output_url: string | null;
  output_metadata: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvatarProfile {
  id: string;
  user_id: string;
  name: string;
  face_image_url: string;
  face_cloudinary_id: string | null;
  voice_model_path: string | null;
  voice_cloned: boolean;
  voice_cloned_at: string | null;
  is_default: boolean;
  language: string;
  created_at: string;
}

export interface ContentLibraryItem {
  id: string;
  user_id: string;
  job_id: string;
  title: string;
  module: Module;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ContentClip {
  id: string;
  user_id: string;
  source_job_id: string | null;
  source_url: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  viral_score: number;
  hook_strength: number;
  signal_breakdown: Record<string, number>;
  transcript: string;
  hook_text: string | null;
  generated_titles: string[];
  generated_hashtags: Record<string, string[]>;
  file_tiktok_url: string | null;
  file_reels_url: string | null;
  file_shorts_url: string | null;
  file_twitter_url: string | null;
  file_linkedin_url: string | null;
  status: string;
  caption_style: string;
  created_at: string;
}

export interface ViralContent {
  id: string;
  platform: string;
  content_url: string;
  thumbnail_url: string | null;
  title: string;
  creator_handle: string;
  creator_followers: number;
  niches: string[];
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  views_per_hour: number;
  hook_type: string | null;
  viral_triggers: string[];
  transcript_preview: string | null;
  full_analysis: Record<string, unknown> | null;
  viral_score: number;
  discovered_at: string;
  week_number: number;
  is_trending: boolean;
  trend_score: number;
}

export interface RivalProfile {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  profile_url: string;
  username: string;
  follower_count: number | null;
  monitoring_active: boolean;
  analysis_data: Record<string, unknown> | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface RivalPost {
  id: string;
  rival_id: string;
  user_id: string;
  post_url: string;
  thumbnail_url: string | null;
  title: string | null;
  caption: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  views_per_hour: number;
  is_viral: boolean;
  is_popping_off: boolean;
  viral_score: number;
  why_it_worked: string | null;
  hook_type: string | null;
  posted_at: string;
  discovered_at: string;
}

export interface ContentRemix {
  id: string;
  user_id: string;
  source_url: string;
  source_type: string;
  why_it_worked: string;
  hook_type: string | null;
  story_arc: string | null;
  viral_triggers: string[];
  pacing_analysis: Record<string, unknown> | null;
  viral_score: number;
  remix_script_v1: string | null;
  remix_script_v2: string | null;
  remix_script_v3: string | null;
  user_niche: string;
  user_audience: string;
  remix_goal: string;
  created_at: string;
}

export interface WorkflowDefinition {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentPreset {
  id: string;
  user_id: string;
  name: string;
  module: Module;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ---------------------------------------------------------------------------
// Generation request payloads
// ---------------------------------------------------------------------------

export interface GenerateAvatarRequest {
  script: string;
  avatar_id: string;
  quality_mode: 'fast' | 'premium';
  caption_style?: 'hormozi' | 'netflix' | 'tiktok' | 'none';
  language?: string;
  style?: 'casual' | 'professional' | 'energetic' | 'educational';
}

export interface GenerateMovieRequest {
  prompt: string;
  style: string;
  duration_minutes: number;
  screenplay_text?: string;
  genre?: string;
  camera_style?: string;
  pacing?: string;
  generate_score?: boolean;
}

export interface GenerateDocumentaryRequest {
  sources: string[];
  style: string;
  duration_minutes: number;
  narration_voice?: string;
}

export interface GenerateClipRequest {
  source_url: string;
  max_clips?: number;
  min_duration?: number;
  max_duration?: number;
  platforms: string[];
  caption_style: string;
  crop_mode: 'face_track' | 'smart_center' | 'split_screen';
  hook_overlay?: boolean;
  custom_instructions?: string;
}

export interface GenerateRemixRequest {
  source_url: string;
  user_niche: string;
  user_audience: string;
  remix_goal: 'same_topic' | 'extract_structure' | 'counter_narrative' | 'expand_point';
  target_platform?: string;
  voice_style?: string;
}

export interface GenerateDubbingRequest {
  video_url: string;
  source_lang?: string;
  target_lang: string;
  preserve_background?: boolean;
  sync_lips?: boolean;
  clone_voice?: boolean;
  add_captions?: boolean;
}

export interface GenerateThumbnailRequest {
  video_title: string;
  style: string;
  platform: string;
  reference_image_url?: string;
}
