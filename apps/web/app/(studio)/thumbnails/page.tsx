'use client';

// MY STUDIO — Thumbnail Engine Page (M10)

import { useState, useCallback, useRef } from 'react';
import { Download, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { triggerGeneration, pollJobStatus } from '@/lib/modal';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/ui/StepProgress';

type StyleMode = 'photorealistic' | 'illustration' | 'graphic' | 'minimal';
type PlatformMode = 'youtube' | 'tiktok' | 'instagram' | 'twitter';

export function ThumbnailsPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleMode>('photorealistic');
  const [platform, setPlatform] = useState<PlatformMode>('youtube');

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<any | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const pollerRef = useRef<{ stop: () => void } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    setJobStatus(null);

    try {
      const response = await triggerGeneration('thumbnail', {
        prompt: prompt.trim(),
        style,
        count: 3,
        platform,
      });

      const poller = pollJobStatus(response.jobId, (status) => {
        setJobStatus(status);
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
  }, [prompt, style, platform]);

  const handleReset = () => {
    pollerRef.current?.stop();
    setJobStatus(null);
    setGenerationError(null);
    setIsGenerating(false);
  };

  const getSteps = () => {
    return [
      { label: 'Queued', status: (jobStatus ? 'complete' : 'pending') as 'pending' | 'active' | 'complete' | 'error' },
      { label: 'Generating Images (FLUX.1)', status: (jobStatus?.status === 'complete' ? 'complete' : jobStatus?.status === 'processing' ? 'active' : 'pending') as 'pending' | 'active' | 'complete' | 'error' },
      { label: 'Done', status: (jobStatus?.status === 'complete' ? 'complete' : 'pending') as 'pending' | 'active' | 'complete' | 'error' },
    ];
  };

  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Thumbnail Engine</h1>
        <p className="mt-2 text-text-secondary">
          Generate highly clickable, A/B test ready thumbnails using FLUX.1.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label className="mb-3 block text-sm font-medium text-text-primary">Video Title / Concept</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city in the desert, bright sunlight, cinematic..."
              className="h-32 w-full resize-none rounded-lg border border-border bg-bg p-4 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled={isGenerating}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase text-text-secondary/60">Style</p>
              <select value={style} onChange={(e)=>setStyle(e.target.value as StyleMode)} className="w-full bg-bg p-2 rounded-lg border border-border text-sm">
                <option value="photorealistic">Photorealistic</option>
                <option value="illustration">Illustration</option>
                <option value="graphic">Graphic Design</option>
                <option value="minimal">Minimalist</option>
              </select>
            </div>
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <p className="mb-3 text-xs font-medium uppercase text-text-secondary/60">Format</p>
              <select value={platform} onChange={(e)=>setPlatform(e.target.value as PlatformMode)} className="w-full bg-bg p-2 rounded-lg border border-border text-sm">
                <option value="youtube">YouTube (16:9)</option>
                <option value="tiktok">TikTok/Shorts (9:16)</option>
                <option value="instagram_square">Instagram (1:1)</option>
              </select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={!canGenerate} isLoading={isGenerating} size="lg" className="w-full">
            {isGenerating ? 'Generating...' : 'Create 3 Thumbnails'}
          </Button>
        </div>

        <div className="space-y-6">
          {jobStatus || generationError ? (
            <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">Status</p>
              </div>
              <StepProgress steps={getSteps()} />
              {generationError && (
                <div className="mt-4 flex gap-2 text-sm text-error bg-error/10 p-3 rounded-lg"><AlertCircle className="h-4 w-4"/> {generationError}</div>
              )}
              {jobStatus?.status === 'complete' && jobStatus.outputUrl && (
                <div className="mt-6 border-t border-border pt-5">
                  <div className="mb-4 rounded-lg overflow-hidden bg-bg">
                    <img src={jobStatus.outputUrl} className="w-full aspect-video object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <a href={jobStatus.outputUrl} download className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"><Download className="h-4 w-4" /> Download</a>
                    <button onClick={handleReset} className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"><RefreshCw className="h-4 w-4" /> New</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="rounded-xl border border-border bg-surface-1 p-5">
                <div className="mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /><p className="text-sm font-medium text-text-primary">Best Practices</p></div>
                <p className="text-sm text-text-secondary">Describe your video's core concept. The AI will generate 3 highly clickable variations using FLUX.1.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ThumbnailsPage as default };
