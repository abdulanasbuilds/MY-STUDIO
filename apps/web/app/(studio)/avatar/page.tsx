'use client';

// MY STUDIO — Avatar Studio Page
// PURPOSE: Full UI for Avatar Studio module (M01)
// FEATURES: Script input, avatar selection, quality mode, generation with progress polling

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  User,
  Upload,
  Mic,
  Play,
  Download,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Volume2,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvatarProfile {
  id: string;
  name: string;
  face_image_url: string;
  voice_cloned: boolean;
  is_default: boolean;
  language: string;
}

type QualityMode = 'fast' | 'premium';
type CaptionStyle = 'hormozi' | 'netflix' | 'tiktok' | 'none';
type GenerationStyle = 'casual' | 'professional' | 'energetic' | 'educational';

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  currentStep: string;
  progress: number;
  outputUrl: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUALITY_MODES: { value: QualityMode; label: string; description: string; icon: typeof Zap }[] = [
  { value: 'fast', label: 'Fast', description: '~2 min, 720p', icon: Zap },
  { value: 'premium', label: 'Premium', description: '~5 min, 1080p upscaled', icon: Sparkles },
];

const CAPTION_STYLES: { value: CaptionStyle; label: string }[] = [
  { value: 'none', label: 'No Captions' },
  { value: 'hormozi', label: 'Hormozi Bold' },
  { value: 'netflix', label: 'Netflix Minimal' },
  { value: 'tiktok', label: 'TikTok Pop' },
];

const STYLE_OPTIONS: { value: GenerationStyle; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'educational', label: 'Educational' },
];

const PIPELINE_STEPS = [
  'Queued',
  'Generating Speech',
  'Creating Avatar Video',
  'Refining Lip Sync',
  'Enhancing Quality',
  'Uploading',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  downloading_face_image: 1,
  generating_speech: 1,
  generating_avatar_video: 2,
  refining_lip_sync: 3,
  enhancing_quality: 4,
  skipping_enhancement: 4,
  uploading: 5,
  saving_to_library: 5,
  done: 6,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Page() {
  // Form state
  const [script, setScript] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarProfile | null>(null);
  const [qualityMode, setQualityMode] = useState<QualityMode>('fast');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('none');
  const [style, setStyle] = useState<GenerationStyle>('casual');

  // Avatar profiles state
  const [avatars, setAvatars] = useState<AvatarProfile[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Polling cleanup ref
  const pollerRef = useRef<{ stop: () => void } | null>(null);

  // Fetch avatar profiles on mount
  useEffect(() => {
    fetchAvatars();
    return () => {
      pollerRef.current?.stop();
    };
  }, []);

  const fetchAvatars = useCallback(async () => {
    setLoadingAvatars(true);
    try {
      const response = await fetch('/api/avatars');
      if (response.ok) {
        const data = await response.json() as { avatars: AvatarProfile[] };
        setAvatars(data.avatars ?? []);
        // Auto-select default avatar
        const defaultAvatar = (data.avatars ?? []).find((a: AvatarProfile) => a.is_default);
        if (defaultAvatar) {
          setSelectedAvatar(defaultAvatar);
        }
      }
    } catch {
      // Will show empty state
    } finally {
      setLoadingAvatars(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!script.trim() || !selectedAvatar) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('avatar', {
        script: script.trim(),
        avatar_id: selectedAvatar.id,
        quality_mode: qualityMode,
        caption_style: captionStyle,
        language: selectedAvatar.language,
        style,
      });

      // Start polling for status updates
      const poller = pollJobStatus(response.jobId, (status) => {
        setJobStatus({
          id: status.id,
          status: status.status,
          currentStep: (status as unknown as { currentStep: string }).currentStep ?? status.step ?? 'queued',
          progress: (status as unknown as { progress: number }).progress ?? 0,
          outputUrl: (status as unknown as { outputUrl: string | null }).outputUrl ?? null,
          error: status.error ?? null,
        });

        if (status.status === 'complete' || status.status === 'failed') {
          setIsGenerating(false);
          if (status.status === 'failed') {
            setGenerationError(status.error ?? 'Generation failed. Please try again.');
          }
        }
      });

      pollerRef.current = poller;
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  }, [script, selectedAvatar, qualityMode, captionStyle, style]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setIsGenerating(false);
  }, []);

  // Build step progress data
  const getSteps = () => {
    const currentStepIndex = jobStatus ? (STEP_MAP[jobStatus.currentStep] ?? 0) : -1;

    return PIPELINE_STEPS.map((label, index) => ({
      label,
      status: ((): 'pending' | 'active' | 'complete' | 'error' => {
        if (jobStatus?.status === 'failed' && index === currentStepIndex) return 'error';
        if (index < currentStepIndex) return 'complete';
        if (index === currentStepIndex) return 'active';
        return 'pending';
      })(),
    }));
  };

  const scriptWordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.max(1, Math.round(scriptWordCount / 2.5)); // ~150 wpm
  const canGenerate = script.trim().length > 0 && selectedAvatar !== null && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Avatar Studio</h1>
        <p className="mt-2 text-text-secondary">
          Create AI talking head videos from text. Write a script, select your avatar, and generate.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column — Script & Settings */}
        <div className="space-y-6">
          {/* Script input */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="script" className="text-sm font-medium text-text-primary">
                Script
              </label>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span>{scriptWordCount} words</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{estimatedDuration}s
                </span>
                <span>{script.length}/2000</span>
              </div>
            </div>
            <textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, 2000))}
              placeholder="Write what your avatar should say..."
              className="h-40 w-full resize-none rounded-lg border border-border bg-bg p-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled={isGenerating}
            />
          </div>

          {/* Settings row */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Quality mode */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Quality
              </p>
              <div className="space-y-2">
                {QUALITY_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setQualityMode(mode.value)}
                      disabled={isGenerating}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        qualityMode === mode.value
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                          : 'text-text-secondary hover:bg-surface-2',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">{mode.label}</p>
                        <p className="text-xs opacity-60">{mode.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caption style */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Captions
              </p>
              <div className="space-y-1.5">
                {CAPTION_STYLES.map((cs) => (
                  <button
                    key={cs.value}
                    onClick={() => setCaptionStyle(cs.value)}
                    disabled={isGenerating}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      captionStyle === cs.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    {cs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Style
              </p>
              <div className="space-y-1.5">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    disabled={isGenerating}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      style === s.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            isLoading={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Avatar Video'}
          </Button>
        </div>

        {/* Right column — Avatar selection & Progress */}
        <div className="space-y-6">
          {/* Avatar selector */}
          <div className="rounded-xl border border-border bg-surface-1 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">Your Avatars</p>
              <button
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors"
                title="Create a new avatar"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>

            {loadingAvatars ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-text-secondary/40" />
              </div>
            ) : avatars.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-bg p-6 text-center">
                <User className="mx-auto h-10 w-10 text-text-secondary/30" />
                <p className="mt-3 text-sm text-text-secondary">No avatars yet</p>
                <p className="mt-1 text-xs text-text-secondary/60">
                  Upload a face photo and clone your voice to create your first avatar.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-2/80 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Face Photo
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-2/80 transition-colors">
                    <Mic className="h-4 w-4" />
                    Clone Voice
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    disabled={isGenerating}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                      selectedAvatar?.id === avatar.id
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'hover:bg-surface-2',
                    )}
                  >
                    {/* Avatar thumbnail */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-2">
                      {avatar.face_image_url ? (
                        <img
                          src={avatar.face_image_url}
                          alt={avatar.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-text-secondary/40" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {avatar.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-text-secondary">
                        {avatar.voice_cloned && (
                          <span className="flex items-center gap-1 text-success">
                            <Volume2 className="h-3 w-3" />
                            Voice cloned
                          </span>
                        )}
                        {avatar.is_default && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generation progress */}
          {(jobStatus || generationError) && (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">Generation Progress</p>
                {jobStatus && (
                  <span className="text-xs text-text-secondary">
                    {jobStatus.progress}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {jobStatus && (
                <div className="mb-5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        jobStatus.status === 'failed' ? 'bg-error' : 'bg-primary',
                      )}
                      style={{ width: `${jobStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Step progress */}
              {jobStatus && <StepProgress steps={getSteps()} />}

              {/* Error message */}
              {generationError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-error/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                  <p className="text-sm text-error">{generationError}</p>
                </div>
              )}

              {/* Completion */}
              {jobStatus?.status === 'complete' && jobStatus.outputUrl && (
                <div className="mt-5 space-y-4">
                  {/* Video preview */}
                  <div className="overflow-hidden rounded-lg bg-bg">
                    <video
                      src={jobStatus.outputUrl}
                      controls
                      className="w-full"
                      poster={jobStatus.outputUrl.replace('/video/upload/', '/video/upload/so_0,w_640,h_360,c_fill/').replace(/\.[^.]+$/, '.jpg')}
                    />
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={jobStatus.outputUrl}
                      download
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <button
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      New
                    </button>
                  </div>
                </div>
              )}

              {/* Failed — retry button */}
              {jobStatus?.status === 'failed' && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleGenerate} variant="primary" size="sm" className="flex-1">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="sm">
                    Reset
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tips card */}
          {!jobStatus && !generationError && (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <p className="mb-3 text-sm font-medium text-text-primary">Tips</p>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success/60" />
                  Keep scripts under 500 words for best quality
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success/60" />
                  Use clear, front-facing face photos
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success/60" />
                  Clone your voice with 10-60s of clear audio
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success/60" />
                  Premium mode adds Real-ESRGAN upscaling
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

;
