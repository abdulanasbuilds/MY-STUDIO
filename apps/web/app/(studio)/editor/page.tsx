'use client';

// MY STUDIO — Professional Editor Page (M04)

import { useState } from 'react';
import { Scissors, Sparkles, RefreshCw, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Page() {
  const [url, setUrl] = useState('');
  const [command, setCommand] = useState('');
  
  const handleGenerate = () => {
      // Stub
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Professional Editor</h1>
        <p className="mt-2 text-text-secondary">
          Edit videos using natural language commands.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label className="mb-3 block text-sm font-medium text-text-primary">Source Video URL</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LinkIcon className="h-5 w-5 text-text-secondary/50" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="block w-full rounded-lg border border-border bg-bg p-3 pl-10 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <label className="mb-3 block text-sm font-medium text-text-primary">Edit Instructions</label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. Cut the first 10 seconds, add a cinematic zoom on the face at 0:45, and boost the colors..."
              className="h-32 w-full resize-none rounded-lg border border-border bg-bg p-4 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <Button onClick={handleGenerate} size="lg" className="w-full">
            Apply Edits
          </Button>
        </div>

        <div className="space-y-6">
             <div className="rounded-xl border border-border bg-surface-1 p-5">
                <div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><p className="text-sm font-medium text-text-primary">Natural Language Editing</p></div>
                <p className="text-sm text-text-secondary">Just describe what you want changed. Our AI parses your command into precise FFmpeg filtergraphs and applies them to your video instantly.</p>
             </div>
        </div>
      </div>
    </div>
  );
}

;
