/**
 * @my-studio/validators — Zod schemas for MY STUDIO
 *
 * Every API request body is validated through one of these schemas.
 * Named exports only.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Generation schemas
// ---------------------------------------------------------------------------

export const generateAvatarSchema = z.object({
  script: z.string().min(1).max(2000),
  avatar_id: z.string().uuid(),
  quality_mode: z.enum(['fast', 'premium']),
  caption_style: z.enum(['hormozi', 'netflix', 'tiktok', 'none']).optional(),
  language: z.string().optional().default('en'),
  style: z.enum(['casual', 'professional', 'energetic', 'educational']).optional(),
});

export const generateMovieSchema = z.object({
  prompt: z.string().min(1).max(5000),
  style: z.string(),
  duration_minutes: z.number().min(1).max(20),
  screenplay_text: z.string().optional(),
  genre: z.string().optional(),
  camera_style: z.string().optional(),
  pacing: z.string().optional(),
  generate_score: z.boolean().optional().default(true),
});

export const generateDocumentarySchema = z.object({
  sources: z.array(z.string()).min(1),
  style: z.string(),
  duration_minutes: z.number().min(1).max(30),
  narration_voice: z.string().optional(),
});

export const generateClipSchema = z.object({
  source_url: z.string().url(),
  max_clips: z.number().min(1).max(15).optional().default(5),
  min_duration: z.number().min(10).optional().default(20),
  max_duration: z.number().max(300).optional().default(180),
  platforms: z.array(z.string()).min(1),
  caption_style: z.string(),
  crop_mode: z.enum(['face_track', 'smart_center', 'split_screen']),
  hook_overlay: z.boolean().optional().default(true),
  custom_instructions: z.string().max(500).optional(),
});

export const generateRemixSchema = z.object({
  source_url: z.string().url(),
  user_niche: z.string().min(1),
  user_audience: z.string().min(1),
  remix_goal: z.enum(['same_topic', 'extract_structure', 'counter_narrative', 'expand_point']),
  target_platform: z.string().optional(),
  voice_style: z.string().optional(),
});

export const generateDubbingSchema = z.object({
  video_url: z.string().url(),
  source_lang: z.string().optional(),
  target_lang: z.string().min(2).max(10),
  preserve_background: z.boolean().optional().default(true),
  sync_lips: z.boolean().optional().default(true),
  clone_voice: z.boolean().optional().default(true),
  add_captions: z.boolean().optional().default(false),
});

export const generateThumbnailSchema = z.object({
  video_title: z.string().min(1).max(200),
  style: z.string(),
  platform: z.string(),
  reference_image_url: z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// Operational schemas
// ---------------------------------------------------------------------------

export const addRivalSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(['youtube', 'instagram', 'tiktok', 'twitter']),
  profile_url: z.string().url(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['queued', 'processing', 'complete', 'failed']),
  current_step: z.string(),
  progress_percent: z.number().min(0).max(100),
  output_url: z.string().optional(),
  error_message: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type GenerateAvatarInput = z.infer<typeof generateAvatarSchema>;
export type GenerateMovieInput = z.infer<typeof generateMovieSchema>;
export type GenerateDocumentaryInput = z.infer<typeof generateDocumentarySchema>;
export type GenerateClipInput = z.infer<typeof generateClipSchema>;
export type GenerateRemixInput = z.infer<typeof generateRemixSchema>;
export type GenerateDubbingInput = z.infer<typeof generateDubbingSchema>;
export type GenerateThumbnailInput = z.infer<typeof generateThumbnailSchema>;
export type AddRivalInput = z.infer<typeof addRivalSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;

export const generateRemixVideoSchema = z.object({
  sourceUrl: z.string().url(),
  remixAngle: z.string().min(1).max(500),
  style: z.enum(['dynamic', 'minimal', 'cinematic']).default('dynamic'),
});
