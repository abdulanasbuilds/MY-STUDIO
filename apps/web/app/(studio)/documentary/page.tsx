'use client';

// MY STUDIO — Documentary Engine Page
// PURPOSE: Full UI for Documentary module (M03)

import { useState, useCallback, useRef } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  Play,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StyleMode = 'cinematic' | 'investigative' | 'historical';
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
  { value: 'cinematic', label: 'Cinematic', description: 'Netflix-style highly visual docs' },
  { value: 'investigative', label: 'Investigative', description: 'Fast-paced, data-driven' },
  { value: 'historical', label: 'Historical', description: 'Archival feel with dramatic score' },
];

const DURATIONS: { value: DurationMode; label: string; min: number }[] = [
  { value: 'short', label: 'Short', min: 1 },
  { value: 'medium', label: 'Medium', min: 3 },
  { value: 'long', label: 'Long', min: 5 },
];

const PIPELINE_STEPS = [
  'Queued',
  'Researching Topic',
  'Generating Script & Voice',
  'Generating Scenes',
  'Scoring & Assembly',
  'Uploading',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  researching_topic: 1,
  generating_narration: 2,
  generating_scenes: 3,
  generating_score: 4,
  assembling_documentary: 4,
  uploading: 5,
  saving_to_library: 5,
  done: 6,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentaryPage() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<StyleMode>('cinematic');
  const [duration, setDuration] = useState<DurationMode>('short');

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('documentary', {
        sources: [topic.trim()], // sending as sources to match the schema
        style,
        duration_minutes: DURATIONS.find(d => d.value === duration)?.min || 1,
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
  }, [topic, style, duration]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setIsGenerating(false);
  }, []);

  const getSteps = () => {
    let currentStepIndex = STEP_MAP[jobStatus?.currentStep || 'queued'];
    if (currentStepIndex === undefined && jobStatus?.currentStep.startsWith('generating_scene')) {
        currentStepIndex = 3;
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

  const canGenerate = topic.trim().length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Documentary Engine</h1>
        <p className="mt-2 text-text-secondary">
          Auto-generate mini-documentaries from a single topic using AI research, visual generation, and TTS narration.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column — Input & Settings */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="topic" className="text-sm font-medium text-text-primary">
                Topic or Article URL
              </label>
            </div>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The rise and fall of Blockbuster Video..."
              className="h-24 w-full resize-none rounded-lg border border-border bg-bg p-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled={isGenerating}
            />
          </div>

          {/* Settings row */}
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Target Duration
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
                        <Clock className="h-3 w-3" /> {d.min}m
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
            {isGenerating ? 'Producing Documentary...' : 'Produce Documentary'}
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
                  <div className="overflow-hidden rounded-lg bg-bg">
                    <video
                      src={jobStatus.outputUrl}
                      controls
                      className="w-full aspect-video"
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
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">Research Engine</p>
              </div>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><strong className="text-text-primary">Fully Autonomous:</strong> You provide the topic. The AI researches it, writes a compelling narration script, and generates accompanying footage.</li>
                <li><strong className="text-text-primary">B-Roll:</strong> Automatically generates highly contextual B-roll clips using video generation models.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DocumentaryPage as default };
