'use client';

// MY STUDIO — Audio Studio Page
// PURPOSE: Full UI for Audio Studio module (M09)

import { useState, useCallback, useRef } from 'react';
import {
  Music,
  Split,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AudioMode = 'generate' | 'separate';

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  currentStep: string;
  progress: number;
  outputUrl: string | null;
  error: string | null;
}

const GENERATE_STEPS = [
  'Queued',
  'Generating Music',
  'Mastering',
  'Uploading',
  'Done',
];

const SEPARATE_STEPS = [
  'Queued',
  'Downloading Source',
  'Separating Stems',
  'Packaging',
  'Uploading',
  'Done',
];

const STEP_MAP_GENERATE: Record<string, number> = {
  queued: 0,
  initializing: 0,
  generating_music: 1,
  mastering: 2,
  uploading: 3,
  saving_to_library: 3,
  done: 4,
  error: -1,
};

const STEP_MAP_SEPARATE: Record<string, number> = {
  queued: 0,
  initializing: 0,
  downloading_source: 1,
  separating_stems: 2,
  packaging_stems: 3,
  uploading: 4,
  saving_to_library: 4,
  done: 5,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Page() {
  const [mode, setMode] = useState<AudioMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(15);

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (mode === 'generate' && !prompt.trim()) return;
    if (mode === 'separate' && !url.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('audio', {
        mode,
        prompt: mode === 'generate' ? prompt.trim() : undefined,
        audioUrl: mode === 'separate' ? url.trim() : undefined,
        duration: mode === 'generate' ? duration : undefined,
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
            setGenerationError(status.error ?? 'Generation failed.');
          }
        }
      });

      pollerRef.current = poller;
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  }, [mode, prompt, url, duration]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setIsGenerating(false);
  }, []);

  const getSteps = () => {
    const map = mode === 'generate' ? STEP_MAP_GENERATE : STEP_MAP_SEPARATE;
    const labels = mode === 'generate' ? GENERATE_STEPS : SEPARATE_STEPS;
    
    const currentStepIndex = jobStatus ? (map[jobStatus.currentStep] ?? 0) : -1;

    return labels.map((label, index) => ({
      label,
      status: ((): 'pending' | 'active' | 'complete' | 'error' => {
        if (jobStatus?.status === 'failed' && index === currentStepIndex) return 'error';
        if (index < currentStepIndex) return 'complete';
        if (index === currentStepIndex) return 'active';
        return 'pending';
      })(),
    }));
  };

  const canGenerate = !isGenerating && (
    (mode === 'generate' && prompt.trim().length > 0) ||
    (mode === 'separate' && url.trim().length > 0)
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Audio Studio</h1>
        <p className="mt-2 text-text-secondary">
          Generate royalty-free music or isolate stems from existing tracks.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column — Input & Settings */}
        <div className="space-y-6">
          
          <div className="flex gap-2 rounded-lg bg-surface-1 p-1 border border-border">
            <button
                onClick={() => setMode('generate')}
                className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                    mode === 'generate' ? "bg-bg text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
            >
                <Music className="h-4 w-4" /> Generate Music
            </button>
            <button
                onClick={() => setMode('separate')}
                className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                    mode === 'separate' ? "bg-bg text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
            >
                <Split className="h-4 w-4" /> Separate Stems
            </button>
          </div>

          {mode === 'generate' ? (
              <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-surface-1 p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <label htmlFor="prompt" className="text-sm font-medium text-text-primary">
                        Describe the music
                      </label>
                    </div>
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="80s pop track with bassy drums and synth..."
                      className="h-32 w-full resize-none rounded-lg border border-border bg-bg p-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <div className="rounded-xl border border-border bg-surface-1 p-6">
                      <div className="mb-3 flex items-center justify-between">
                          <label className="text-sm font-medium text-text-primary">Duration (seconds)</label>
                          <span className="text-sm font-bold text-primary">{duration}s</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5" 
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        disabled={isGenerating}
                        className="w-full accent-primary" 
                      />
                  </div>
              </div>
          ) : (
              <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-surface-1 p-6">
                    <label htmlFor="url" className="mb-3 block text-sm font-medium text-text-primary">
                      Source Audio/Video URL
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
                        placeholder="https://youtube.com/watch?v=... or MP4/WAV link"
                        className="block w-full rounded-lg border border-border bg-bg p-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                        disabled={isGenerating}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">
                      The AI will separate the audio into Vocals, Drums, Bass, and Melody.
                    </p>
                  </div>
              </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            isLoading={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? 'Processing...' : (mode === 'generate' ? 'Generate Music' : 'Extract Stems')}
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

              {jobStatus?.status === 'complete' && jobStatus.outputUrl && (
                <div className="mt-6 border-t border-border pt-5 space-y-4">
                  {mode === 'generate' && (
                      <div className="rounded-lg bg-bg p-4 border border-border">
                        <audio
                          src={jobStatus.outputUrl}
                          controls
                          className="w-full"
                        />
                      </div>
                  )}

                  <div className="flex gap-2">
                    <a
                      href={jobStatus.outputUrl}
                      download
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download {mode === 'generate' ? 'Audio' : 'Stems (ZIP)'}
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
              <p className="text-sm font-medium text-text-primary mb-3">Capabilities</p>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"><Music className="h-3.5 w-3.5" /></div>
                  <p><strong className="text-text-primary">MusicGen:</strong> Creates studio-quality, royalty-free background tracks matching your vibe.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"><Split className="h-3.5 w-3.5" /></div>
                  <p><strong className="text-text-primary">Demucs:</strong> Magically separates mixed audio into isolated Vocals, Drums, Bass, and Other.</p>
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
