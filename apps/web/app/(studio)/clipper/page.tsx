'use client';

// MY STUDIO — Clipper Page
// PURPOSE: Full UI for Smart Clipper module (M11)

import { useState, useCallback, useRef } from 'react';
import {
  Clapperboard,
  Link as LinkIcon,
  Scissors,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Settings2,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CropMode = 'face_track' | 'smart_center' | 'split_screen';
type CaptionStyle = 'hormozi' | 'netflix' | 'tiktok' | 'none';

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  currentStep: string;
  progress: number;
  outputMetadata: Record<string, any> | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CROP_MODES: { value: CropMode; label: string; description: string }[] = [
  { value: 'smart_center', label: 'Smart Center', description: 'Keeps action centered' },
  { value: 'face_track', label: 'Face Tracking', description: 'Follows speaker' },
  { value: 'split_screen', label: 'Split Screen', description: 'For podcasts/interviews' },
];

const CAPTION_STYLES: { value: CaptionStyle; label: string }[] = [
  { value: 'tiktok', label: 'TikTok Pop' },
  { value: 'hormozi', label: 'Hormozi Bold' },
  { value: 'netflix', label: 'Netflix Minimal' },
  { value: 'none', label: 'No Captions' },
];

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'reels', label: 'IG Reels' },
  { id: 'shorts', label: 'YT Shorts' },
];

const PIPELINE_STEPS = [
  'Queued',
  'Downloading Video',
  'Transcribing',
  'Analyzing Viral Moments',
  'Extracting & Cropping',
  'Uploading Clips',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  downloading_source: 1,
  transcribing: 2,
  analyzing_moments: 3,
  extracting_clips: 4,
  uploading_clips: 5,
  done: 6,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClipperPage() {
  const [url, setUrl] = useState('');
  const [cropMode, setCropMode] = useState<CropMode>('smart_center');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('tiktok');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'reels', 'shorts']);
  const [maxClips, setMaxClips] = useState(5);

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!url.trim() || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('clip', {
        source_url: url.trim(),
        max_clips: maxClips,
        min_duration: 20,
        max_duration: 180,
        platforms: selectedPlatforms,
        caption_style: captionStyle,
        crop_mode: cropMode,
        hook_overlay: true,
      });

      const poller = pollJobStatus(response.jobId, (status) => {
        setJobStatus({
          id: status.id,
          status: status.status,
          currentStep: (status as any).currentStep ?? 'queued',
          progress: (status as any).progress ?? 0,
          outputMetadata: (status as any).outputMetadata ?? null,
          error: status.error ?? null,
        });

        if (status.status === 'complete' || status.status === 'failed') {
          setIsGenerating(false);
          if (status.status === 'failed') {
            setGenerationError(status.error ?? 'Generation failed.');
          }
        }
      });

      pollerRef.current = poller;
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  }, [url, cropMode, captionStyle, selectedPlatforms, maxClips]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setIsGenerating(false);
    setUrl('');
  }, []);

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

  const canGenerate = url.trim().length > 0 && selectedPlatforms.length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Smart Clipper</h1>
        <p className="mt-2 text-text-secondary">
          Turn long YouTube videos into viral TikToks and Shorts automatically.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column — Input & Settings */}
        <div className="space-y-6">
          {/* URL Input */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label htmlFor="url" className="mb-3 block text-sm font-medium text-text-primary">
              YouTube Video URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LinkIcon className="h-5 w-5 text-text-secondary/50" />
              </div>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="block w-full rounded-lg border border-border bg-bg p-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Settings grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Crop Mode */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                <Scissors className="h-4 w-4" />
                Framing
              </div>
              <div className="space-y-2">
                {CROP_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setCropMode(mode.value)}
                    disabled={isGenerating}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      cropMode === mode.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    <span className="block font-medium">{mode.label}</span>
                    <span className="text-xs opacity-60">{mode.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Caption Style */}
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                  Captions
                </p>
                <select
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value as CaptionStyle)}
                  disabled={isGenerating}
                  className="w-full rounded-lg border border-border bg-bg p-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                >
                  {CAPTION_STYLES.map((cs) => (
                    <option key={cs.value} value={cs.value}>
                      {cs.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Clips */}
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                    Clips to generate
                  </p>
                  <span className="text-sm font-medium text-primary">{maxClips}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxClips}
                  onChange={(e) => setMaxClips(parseInt(e.target.value))}
                  disabled={isGenerating}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
              Target Platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    disabled={isGenerating}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface-2 text-text-secondary hover:bg-surface-3',
                    )}
                  >
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            isLoading={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? 'Extracting Clips...' : 'Find Viral Clips'}
          </Button>
        </div>

        {/* Right column — Progress & Results */}
        <div className="space-y-6">
          {(jobStatus || generationError) ? (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">Status</p>
                {jobStatus && (
                  <span className="text-xs text-text-secondary">{jobStatus.progress}%</span>
                )}
              </div>

              {jobStatus && (
                <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      jobStatus.status === 'failed' ? 'bg-error' : 'bg-primary',
                    )}
                    style={{ width: `${jobStatus.progress}%` }}
                  />
                </div>
              )}

              {jobStatus && <StepProgress steps={getSteps()} />}

              {generationError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-error/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                  <p className="text-sm text-error">{generationError}</p>
                </div>
              )}

              {jobStatus?.status === 'complete' && (
                <div className="mt-6 border-t border-border pt-4">
                  <div className="rounded-lg bg-success/10 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                    <p className="text-sm font-medium text-success">Clips generated successfully!</p>
                    <p className="mt-1 text-xs text-success/80">Check your library to view them.</p>
                  </div>
                  <div className="mt-4">
                    <Button onClick={handleReset} variant="outline" className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clip Another Video
                    </Button>
                  </div>
                </div>
              )}

              {jobStatus?.status === 'failed' && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleGenerate} variant="primary" size="sm" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="sm">
                    Reset
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">How it works</p>
              </div>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">1</div>
                  <p>Paste any YouTube video URL (podcast, interview, vlog)</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">2</div>
                  <p>AI analyzes the transcript to find the most viral moments based on hook strength and retention</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">3</div>
                  <p>Video is automatically cropped to 9:16 and captioned for social media</p>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ClipperPage as default };
