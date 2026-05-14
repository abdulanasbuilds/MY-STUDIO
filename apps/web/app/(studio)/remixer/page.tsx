'use client';

// MY STUDIO — Content Remixer Page
// PURPOSE: Full UI for Content Remixer module (M12)
// NOTE: Renamed to Content Remix in UI to match sidebar, but uses /remixer path

import { useState, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Settings2,
  FileText,
  Copy,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RemixGoal = 'same_topic' | 'extract_structure' | 'counter_narrative' | 'expand_point';
type TargetPlatform = 'tiktok' | 'youtube' | 'instagram' | 'twitter' | 'linkedin';

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

const REMIX_GOALS: { value: RemixGoal; label: string; description: string }[] = [
  { value: 'extract_structure', label: 'Extract Structure', description: 'Keep the viral framework, apply to your niche' },
  { value: 'same_topic', label: 'Same Topic, Your Voice', description: 'Cover the same topic but in your unique style' },
  { value: 'counter_narrative', label: 'Counter-Narrative', description: 'Argue against the original video\'s point' },
  { value: 'expand_point', label: 'Expand on a Point', description: 'Take one detail and dive deeper into it' },
];

const PLATFORMS: { value: TargetPlatform; label: string }[] = [
  { value: 'tiktok', label: 'TikTok / Shorts' },
  { value: 'youtube', label: 'YouTube Long-form' },
  { value: 'linkedin', label: 'LinkedIn Text Post' },
  { value: 'twitter', label: 'Twitter Thread' },
];

const PIPELINE_STEPS = [
  'Queued',
  'Downloading Source',
  'Transcribing',
  'Analyzing Structure',
  'Generating Scripts',
  'Saving Results',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  downloading_source: 1,
  transcribing: 2,
  analyzing_structure: 3,
  generating_scripts: 4,
  saving_results: 5,
  done: 6,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Page() {
  const [url, setUrl] = useState('');
  const [userNiche, setUserNiche] = useState('');
  const [userAudience, setUserAudience] = useState('');
  const [remixGoal, setRemixGoal] = useState<RemixGoal>('extract_structure');
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('tiktok');

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const [resultData, setResultData] = useState<any | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!url.trim() || !userNiche.trim() || !userAudience.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);
    setResultData(null);

    try {
      const response = await triggerGeneration('remix', {
        source_url: url.trim(),
        user_niche: userNiche.trim(),
        user_audience: userAudience.trim(),
        remix_goal: remixGoal,
        target_platform: targetPlatform,
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

        if (status.status === 'complete') {
            setIsGenerating(false);
            // Parse the output string containing JSON if it exists
            if ((status as any).outputUrl) {
                try {
                   // outputUrl holds the JSON manifest in this pipeline since we return it as a string
                   setResultData(JSON.parse((status as any).outputUrl));
                } catch(e) {
                   // Fallback
                }
            }
        } else if (status.status === 'failed') {
            setIsGenerating(false);
            setGenerationError(status.error ?? 'Generation failed.');
        }
      });

      pollerRef.current = poller;
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  }, [url, userNiche, userAudience, remixGoal, targetPlatform]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setResultData(null);
    setIsGenerating(false);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

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

  const canGenerate = url.trim().length > 0 && userNiche.trim().length > 0 && userAudience.trim().length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Content Remix</h1>
        <p className="mt-2 text-text-secondary">
          Analyze viral videos and adapt their successful frameworks to your niche.
        </p>
      </div>

      <div className={cn("grid gap-8", resultData ? "lg:grid-cols-1" : "lg:grid-cols-[1fr,380px]")}>
        {/* Left column — Input & Settings (Hidden when showing results) */}
        {!resultData && (
        <div className="space-y-6">
          {/* Source URL */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label htmlFor="url" className="mb-3 block text-sm font-medium text-text-primary">
              Viral Video URL
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
            <p className="mt-2 text-xs text-text-secondary">
              Find a video that performed extremely well in your industry or a parallel one.
            </p>
          </div>

          {/* Context */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
             <div>
                 <label htmlFor="niche" className="mb-2 block text-sm font-medium text-text-primary">
                  Your Niche / Industry
                </label>
                <input
                  type="text"
                  id="niche"
                  value={userNiche}
                  onChange={(e) => setUserNiche(e.target.value)}
                  placeholder="e.g. B2B SaaS, Fitness coaching, Real estate"
                  className="block w-full rounded-lg border border-border bg-bg p-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  disabled={isGenerating}
                />
             </div>
             
             <div>
                 <label htmlFor="audience" className="mb-2 block text-sm font-medium text-text-primary">
                  Target Audience
                </label>
                <input
                  type="text"
                  id="audience"
                  value={userAudience}
                  onChange={(e) => setUserAudience(e.target.value)}
                  placeholder="e.g. Founders, Beginners, Home buyers"
                  className="block w-full rounded-lg border border-border bg-bg p-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  disabled={isGenerating}
                />
             </div>
          </div>

          {/* Settings grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Remix Goal */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                <Settings2 className="h-4 w-4" />
                Remix Goal
              </div>
              <div className="space-y-2">
                {REMIX_GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setRemixGoal(goal.value)}
                    disabled={isGenerating}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      remixGoal === goal.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    <span className="block font-medium">{goal.label}</span>
                    <span className="text-xs opacity-60">{goal.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                <FileText className="h-4 w-4" />
                Format
              </div>
              <div className="space-y-2">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.value}
                    onClick={() => setTargetPlatform(platform.value)}
                    disabled={isGenerating}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      targetPlatform === platform.value
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    <span className="block font-medium">{platform.label}</span>
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
            {isGenerating ? 'Analyzing & Remixing...' : 'Generate Remix Script'}
          </Button>
        </div>
        )}

        {/* Right column (or full width if results exist) — Progress & Results */}
        <div className="space-y-6">
          {(jobStatus || generationError) && !resultData ? (
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
          ) : !resultData ? (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">How it works</p>
              </div>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">1</div>
                  <p>Provide a link to a video that went viral</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">2</div>
                  <p>AI extracts the psychological triggers, hooks, and pacing</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">3</div>
                  <p>It rewrites the script using that exact framework, applied to your specific niche and audience</p>
                </li>
              </ul>
            </div>
          ) : null}
          
          {/* Results View */}
          {resultData && (
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text-primary">Your Remix is Ready</h2>
                    <Button onClick={handleReset} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Start Over
                    </Button>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Generated Script */}
                    <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-semibold text-text-primary text-lg">Generated Script</h3>
                            <button 
                              onClick={() => copyToClipboard(resultData.remix_scripts[0]?.scenes?.map((s: any) => s.narration).join('\n\n'))}
                              className="text-text-secondary hover:text-primary transition-colors"
                              title="Copy full script"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div>
                            <p className="text-xs uppercase text-text-secondary/60 font-medium mb-1">Title Idea</p>
                            <p className="text-md font-bold text-primary">{resultData.remix_scripts[0]?.title}</p>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                            {resultData.remix_scripts[0]?.scenes?.map((scene: any, idx: number) => (
                                <div key={idx} className="rounded-lg bg-bg p-4 border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-text-secondary/60">SCENE {idx + 1} ({scene.duration}s)</span>
                                    </div>
                                    <p className="text-sm text-text-primary mb-3">"{scene.narration}"</p>
                                    <div className="text-xs text-text-secondary flex items-start gap-2">
                                        <span className="text-primary font-medium">Visual:</span> {scene.visual_direction}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-2">
                            <p className="text-xs uppercase text-text-secondary/60 font-medium mb-1">Call to action</p>
                            <p className="text-sm text-text-primary italic">"{resultData.remix_scripts[0]?.cta}"</p>
                        </div>
                        
                        <div className="pt-4 border-t border-border flex justify-end">
                            <Button variant="primary">
                                Send to Avatar Studio
                            </Button>
                        </div>
                    </div>
                    
                    {/* Source Analysis */}
                    <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-6">
                        <div className="border-b border-border pb-4">
                            <h3 className="font-semibold text-text-primary text-lg">Source Analysis</h3>
                            <p className="text-sm text-text-secondary mt-1">Why the original video went viral</p>
                        </div>
                        
                        <div>
                            <p className="text-xs uppercase text-text-secondary/60 font-medium mb-1">The Hook</p>
                            <p className="text-sm text-text-primary">{resultData.source_analysis?.hook}</p>
                        </div>
                        
                        <div>
                            <p className="text-xs uppercase text-text-secondary/60 font-medium mb-2">Structure Framework</p>
                            <div className="space-y-2">
                                {resultData.source_analysis?.structure?.map((part: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 text-sm">
                                        <span className="font-medium text-text-secondary w-16">{part.purpose}</span>
                                        <span className="text-text-primary">{part.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-xs uppercase text-text-secondary/60 font-medium mb-1">Pacing & Themes</p>
                            <p className="text-sm text-text-primary mb-2">{resultData.source_analysis?.pacing}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {resultData.source_analysis?.themes?.map((theme: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-surface-2 rounded text-xs text-text-secondary">{theme}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

;
