'use client';

// MY STUDIO — Competitor Spy Page
// PURPOSE: Full UI for Competitor Spy module (M14)

import { useState, useCallback, useRef } from 'react';
import {
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Target,
  BarChart,
  Lightbulb,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Platform = 'youtube' | 'tiktok' | 'instagram' | 'twitter';

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

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X' },
];

const PIPELINE_STEPS = [
  'Queued',
  'Fetching Profile',
  'Analyzing Strategy',
  'Saving Results',
  'Done',
];

const STEP_MAP: Record<string, number> = {
  queued: 0,
  initializing: 0,
  fetching_profile: 1,
  analyzing_strategy: 2,
  saving_results: 3,
  done: 4,
  error: -1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpyPage() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('youtube');

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const [resultData, setResultData] = useState<any | null>(null);

  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!url.trim() || !name.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);
    setResultData(null);

    try {
      // Using fetch directly since it's a custom endpoint not standard triggerGeneration module
      const response = await fetch('/api/rivals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            channelUrl: url.trim(),
            name: name.trim(),
            platform: platform,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
      
      const { jobId } = await response.json();

      const poller = pollJobStatus(jobId, (status) => {
        setJobStatus({
          id: status.id,
          status: status.status,
          currentStep: (status as any).currentStep ?? 'queued',
          progress: (status as any).progress ?? 0,
          outputUrl: (status as any).outputUrl ?? null,
          error: status.error ?? null,
        });

        if (status.status === 'complete') {
            setIsGenerating(false);
            if ((status as any).outputUrl) {
                try {
                   setResultData(JSON.parse((status as any).outputUrl));
                } catch(e) {
                   // Fallback
                }
            }
        } else if (status.status === 'failed') {
            setIsGenerating(false);
            setGenerationError(status.error ?? 'Analysis failed.');
        }
      });

      pollerRef.current = poller;
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(err instanceof Error ? err.message : 'Failed to start analysis');
    }
  }, [url, name, platform]);

  const handleReset = useCallback(() => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setResultData(null);
    setIsGenerating(false);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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

  const canGenerate = url.trim().length > 0 && name.trim().length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Competitor Spy</h1>
        <p className="mt-2 text-text-secondary">
          Analyze any creator's channel to reverse-engineer their growth strategy and content themes.
        </p>
      </div>

      <div className={cn("grid gap-8", resultData ? "lg:grid-cols-1" : "lg:grid-cols-[1fr,380px]")}>
        {/* Left column — Input & Settings */}
        {!resultData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
             <div>
                 <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
                  Competitor Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MrBeast, Alex Hormozi"
                  className="block w-full rounded-lg border border-border bg-bg p-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  disabled={isGenerating}
                />
             </div>
             
             <div>
                 <label htmlFor="url" className="mb-2 block text-sm font-medium text-text-primary">
                  Profile URL
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-text-secondary/50" />
                  </div>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="block w-full rounded-lg border border-border bg-bg p-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    disabled={isGenerating}
                  />
                </div>
             </div>
             
             <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPlatform(p.value)}
                        disabled={isGenerating}
                        className={cn(
                          'rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                          platform === p.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface-2 text-text-secondary hover:bg-surface-3',
                        )}
                      >
                        {p.label}
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
            {isGenerating ? 'Analyzing...' : 'Analyze Competitor'}
          </Button>
        </div>
        )}

        {/* Right column — Progress & Results */}
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
                <Target className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">Intel Report</p>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                  The AI will generate a comprehensive report including:
              </p>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success/60" /> Posting frequency and best times
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success/60" /> Top performing content themes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success/60" /> Successful hook frameworks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success/60" /> Actionable growth recommendations
                </li>
              </ul>
            </div>
          ) : null}
          
          {/* Results View */}
          {resultData && (
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-text-primary">Intelligence Report: {resultData.profile?.username}</h2>
                    <Button onClick={handleReset} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> New Analysis
                    </Button>
                </div>
                
                {/* Top Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-border bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase text-text-secondary/60">Followers</p>
                        <p className="text-xl font-bold text-text-primary">{formatNumber(resultData.profile?.follower_count || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase text-text-secondary/60">Engagement</p>
                        <p className="text-xl font-bold text-primary">{resultData.profile?.engagement_rate}%</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase text-text-secondary/60">Posts/Week</p>
                        <p className="text-xl font-bold text-text-primary">{resultData.posting_frequency?.posts_per_week}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase text-text-secondary/60">Monthly Growth</p>
                        <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <p className="text-xl font-bold text-success">+{resultData.growth_trend?.monthly_growth_rate}%</p>
                        </div>
                    </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Top Content */}
                    <div className="rounded-xl border border-border bg-surface-1 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-text-primary">Top Performing Content</h3>
                        </div>
                        <div className="space-y-4">
                            {resultData.top_content?.map((content: any, i: number) => (
                                <div key={i} className="border-l-2 border-primary/50 pl-3">
                                    <p className="text-sm font-medium text-text-primary">{content.title}</p>
                                    <p className="text-xs text-text-secondary mt-1">
                                        <span className="font-medium text-primary">{formatNumber(content.views)} views</span> — {content.why_it_worked}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Actionable Recommendations */}
                    <div className="rounded-xl border border-border bg-surface-1 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="h-5 w-5 text-warning" />
                            <h3 className="font-semibold text-text-primary">Actionable Takeaways</h3>
                        </div>
                        <ul className="space-y-3">
                            {resultData.recommendations?.map((rec: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                    <div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="mt-6 pt-4 border-t border-border">
                            <h4 className="text-xs font-semibold uppercase text-text-secondary/60 mb-2">Hook Frameworks Used</h4>
                            <div className="flex flex-wrap gap-2">
                                {resultData.hooks_used?.map((hook: string, i: number) => (
                                    <span key={i} className="rounded bg-surface-2 px-2.5 py-1 text-xs text-text-secondary border border-border">
                                        {hook}
                                    </span>
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

export { SpyPage as default };
