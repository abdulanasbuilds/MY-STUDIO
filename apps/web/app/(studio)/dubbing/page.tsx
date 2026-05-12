'use client';

// MY STUDIO — Voice Dubbing Page
// PURPOSE: Full UI for Voice Dubbing module (M15)

import { useState, useCallback, useRef } from 'react';
import {
  Languages,
  Link as LinkIcon,
  Mic,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  Settings2,
  Globe,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

const LANGUAGES = [
  { code: 'es', name: 'Spanish', region: 'Global' },
  { code: 'fr', name: 'French', region: 'Global' },
  { code: 'de', name: 'German', region: 'Europe' },
  { code: 'hi', name: 'Swahili', region: 'Africa' }, // Simulated African lang codes for now
  { code: 'yo', name: 'Yoruba', region: 'Africa' },
  { code: 'zh', name: 'Mandarin', region: 'Asia' },
  { code: 'ar', name: 'Arabic', region: 'Middle East' },
  { code: 'pt', name: 'Portuguese', region: 'Global' },
  { code: 'ja', name: 'Japanese', region: 'Asia' },
  { code: 'ko', name: 'Korean', region: 'Asia' },
];

const PIPELINE_STEPS = [
  'Queued',
  'Downloading Source',
  'Transcribing Audio',
  'Translating (NLLB-200)',
  'Cloning Voice & Synthesizing',
  'Applying Lip Sync (MuseTalk)',
  'Uploading',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  downloading_source: 1,
  transcribing: 2,
  translating: 3,
  synthesizing_speech: 4,
  applying_lip_sync: 5,
  merging_audio: 5,
  uploading: 6,
  saving_to_library: 6,
  done: 7,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DubbingPage() {
  const [url, setUrl] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [syncLips, setSyncLips] = useState(true);
  const [cloneVoice, setCloneVoice] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!url.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('dub', {
        videoUrl: url.trim(),
        targetLanguage: targetLang,
        lipSync: syncLips,
        cloneVoice: cloneVoice,
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
  }, [url, targetLang, syncLips, cloneVoice]);

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

  const canGenerate = url.trim().length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Voice Dubbing</h1>
        <p className="mt-2 text-text-secondary">
          Translate and dub your videos into 200+ languages while preserving your voice and lip movements.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column — Input & Settings */}
        <div className="space-y-6">
          {/* URL Input */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label htmlFor="url" className="mb-3 block text-sm font-medium text-text-primary">
              Source Video URL
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
                placeholder="https://youtube.com/watch?v=... or MP4 link"
                className="block w-full rounded-lg border border-border bg-bg p-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-6">
              {/* Target Language */}
              <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Globe className="h-4 w-4 text-primary" />
                    Target Language
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setTargetLang(lang.code)}
                        disabled={isGenerating}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                          targetLang === lang.code
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-bg text-text-secondary hover:bg-surface-2',
                        )}
                      >
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-[10px] uppercase opacity-50">{lang.code}</span>
                      </button>
                    ))}
                  </div>
              </div>
              
              {/* Advanced Settings */}
              <div className="border-t border-border pt-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Advanced Processing
                  </div>
                  
                  <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex items-center mt-0.5">
                          <input 
                            type="checkbox" 
                            checked={cloneVoice}
                            onChange={(e) => setCloneVoice(e.target.checked)}
                            disabled={isGenerating}
                            className="sr-only" 
                          />
                          <div className={cn(
                            "h-5 w-9 rounded-full transition-colors",
                            cloneVoice ? "bg-primary" : "bg-surface-3"
                          )}></div>
                          <div className={cn(
                            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                            cloneVoice ? "translate-x-4" : "translate-x-0"
                          )}></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">Voice Cloning (XTTS-v2)</p>
                          <p className="text-xs text-text-secondary mt-0.5">Maintain the original speaker's vocal characteristics in the translated language.</p>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex items-center mt-0.5">
                          <input 
                            type="checkbox" 
                            checked={syncLips}
                            onChange={(e) => setSyncLips(e.target.checked)}
                            disabled={isGenerating}
                            className="sr-only" 
                          />
                          <div className={cn(
                            "h-5 w-9 rounded-full transition-colors",
                            syncLips ? "bg-primary" : "bg-surface-3"
                          )}></div>
                          <div className={cn(
                            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                            syncLips ? "translate-x-4" : "translate-x-0"
                          )}></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">Visual Lip Sync (MuseTalk)</p>
                          <p className="text-xs text-text-secondary mt-0.5">Modify the speaker's mouth movements in the video to match the newly generated audio.</p>
                        </div>
                      </label>
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
            {isGenerating ? 'Dubbing Video...' : 'Dub Video'}
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
                  {/* Video preview */}
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
                <Languages className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">Zero-Shot Dubbing</p>
              </div>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  Break language barriers effortlessly. Our dubbing engine transcribes your source video, accurately translates it while preserving context, and generates localized speech that mimics the original voice.
              </p>
              <div className="rounded bg-surface-2 p-3 border border-border">
                  <p className="text-xs font-medium text-text-primary mb-1">Hardware acceleration</p>
                  <p className="text-xs text-text-secondary">Runs on Modal A10G GPUs for incredibly fast multi-model inference.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DubbingPage as default };
