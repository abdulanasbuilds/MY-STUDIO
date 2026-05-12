'use client';

// MY STUDIO — Content Remix Page (M05)
// PURPOSE: Full UI to generate videos from remix scripts

import { useState, useCallback, useRef } from 'react';
import { RefreshCw, Download, Play, Wand2, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

export function RemixPage() {
  const [url, setUrl] = useState('');
  
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Remix Video Generator</h1>
        <p className="mt-2 text-text-secondary">
          Turn your generated remix scripts into fully produced videos.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label className="mb-3 block text-sm font-medium text-text-primary">
              Remix Script Source URL or ID
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LinkIcon className="h-5 w-5 text-text-secondary/50" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste the ID from Content Remixer..."
                className="block w-full rounded-lg border border-border bg-bg p-3 pl-10 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <Button size="lg" className="w-full">
            Generate Remix Video
          </Button>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-text-primary">How it works</p>
              </div>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  Once you've created a script using the Content Remixer tool, bring it here to have the AI assemble the voice, generate the B-roll, and produce the final video automatically.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RemixPage as default };
