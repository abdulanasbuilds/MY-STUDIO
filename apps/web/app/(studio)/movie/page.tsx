'use client';

// MY STUDIO — Movie Generator Page
// PURPOSE: Full UI for Movie Generator module (M02)

import { useState, useCallback, useRef } from 'react';
import {
  Film,
  Sparkles,
  Clock,
  Play,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wand2,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StyleMode = 'cinematic' | 'documentary' | 'anime' | 'realistic';
type DurationMode = 'short' | 'medium' | 'long';

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

const STYLES: { value: StyleMode; label: string; description: string }[] = [
  { value: 'cinematic', label: 'Cinematic', description: 'Hollywood-style lighting & grading' },
  { value: 'realistic', label: 'Hyper-Realistic', description: 'Raw, unedited look' },
  { value: 'documentary', label: 'Documentary', description: 'Handheld, natural lighting' },
  { value: 'anime', label: 'Anime / 2D', description: 'High-quality 2D animation style' },
];

const DURATIONS: { value: DurationMode; label: string; seconds: number }[] = [
  { value: 'short', label: 'Short', seconds: 15 },
  { value: 'medium', label: 'Medium', seconds: 30 },
  { value: 'long', label: 'Long', seconds: 60 },
];

const PIPELINE_STEPS = [
  'Queued',
  'Writing Screenplay',
  'Generating Scenes',
  'Composing Score',
  'Assembling Film',
  'Saving',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  generating_screenplay: 1,
  generating_scenes: 2,
  generating_score: 3,
  assembling_film: 4,
  uploading: 5,
  saving_to_library: 5,
  done: 6,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleMode>('cinematic');
  const [duration, setDuration] = useState<DurationMode>('short');

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('movie', {
        prompt: prompt.trim(),
        style,
        duration,
      });

      const poller = pollJobStatus(response.jobId, (status) => {
        setJobStatus({
          id: status.id,
          status: status.status,
          currentStep: (status as any).currentStep ?? 'queued',
          progress: (status as any).progress ?? 0,
          outputUrl: (status as any).outputUrl ?? null,
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
  }, [prompt, style, duration]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setIsGenerating(false);
  }, []);

  const getSteps = () => {
    // If we're generating scenes, try to parse which scene out of how many
    const currentStepRaw = jobStatus?.currentStep || 'queued';
    
    // We treat all "generating_scene_X" as step 2
    let currentStepIndex = STEP_MAP[currentStepRaw];
    if (currentStepIndex === undefined && currentStepRaw.startsWith('generating_scene')) {
        currentStepIndex = 2;
    } else if (currentStepIndex === undefined) {
        currentStepIndex = jobStatus ? 0 : -1;
    }

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

  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Movie Generator</h1>
        <p className="mt-2 text-text-secondary">
          Create breathtaking short films from a single text prompt using SkyReels-V3 and MusicGen.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column — Input & Settings */}
        <div className="space-y-6">
          {/* Prompt input */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="prompt" className="text-sm font-medium text-text-primary">
                Story / Screenplay
              </label>
            </div>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A lone astronaut discovers an ancient alien structure buried beneath the ice of Europa..."
              className="h-40 w-full resize-none rounded-lg border border-border bg-bg p-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled={isGenerating}
            />
          </div>

          {/* Settings row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Style */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Visual Style
              </p>
              <div className="space-y-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    disabled={isGenerating}
                    className={cn(
                      'flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors',
                      style === s.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-xs opacity-60">{s.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Duration
              </p>
              <div className="space-y-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    disabled={isGenerating}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors',
                      duration === d.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    <span className="font-medium">{d.label}</span>
                    <span className="flex items-center gap-1 text-xs opacity-60">
                        <Clock className="h-3 w-3" /> {d.seconds}s
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            isLoading={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? 'Generating Film...' : 'Produce Movie'}
          </Button>
        </div>

        {/* Right column — Progress & Results */}
        <div className="space-y-6">
          {(jobStatus || generationError) ? (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">Production Status</p>
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

              {jobStatus?.status === 'complete' && jobStatus.outputUrl && (
                <div className="mt-6 border-t border-border pt-5 space-y-4">
                  {/* Video preview */}
                  <div className="overflow-hidden rounded-lg bg-bg">
                    <video
                      src={jobStatus.outputUrl}
                      controls
                      className="w-full aspect-video"
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
                <Wand2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">Behind the Magic</p>
              </div>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-primary">1</div>
                  <p><strong className="text-text-primary">Screenplay:</strong> AI expands your prompt into a full scene-by-scene script.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-primary">2</div>
                  <p><strong className="text-text-primary">Direction:</strong> FilMaster determines camera angles, lighting, and pacing.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-primary">3</div>
                  <p><strong className="text-text-primary">Generation:</strong> SkyReels-V3 creates the visual scenes, while MusicGen scores the soundtrack.</p>
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
