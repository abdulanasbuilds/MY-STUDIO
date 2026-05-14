'use client';

// MY STUDIO — Workflow Studio Page
// PURPOSE: Visual automation builder using a React Flow node-based canvas.

import { Play, Save, Settings2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NodeCanvas } from '@/components/workflow/NodeCanvas';

export default function Page() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Workflow Studio</h1>
          <p className="mt-2 text-text-secondary">
            Connect AI models, external triggers, and publishing destinations visually.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings2 className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button variant="primary">
            <Save className="mr-2 h-4 w-4" /> Save Workflow
          </Button>
          <Button className="bg-success text-success-foreground hover:bg-success/90 border-transparent">
            <Play className="mr-2 h-4 w-4" /> Deploy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[240px,1fr] gap-6 min-h-0 flex-1">
        {/* Sidebar - Node Palette */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-1">
          <div className="p-4 border-b border-border bg-surface-2/50">
            <h3 className="font-semibold text-text-primary text-sm">Nodes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase text-text-secondary/60 mb-3 tracking-wider">Triggers</p>
              <div className="space-y-2">
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-primary/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">RSS Feed</p>
                </div>
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-primary/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Webhook</p>
                </div>
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-primary/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Schedule (Cron)</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-text-secondary/60 mb-3 tracking-wider">AI Models</p>
              <div className="space-y-2">
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-secondary/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Gemini 1.5 Pro</p>
                </div>
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-secondary/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">HunyuanVideo</p>
                </div>
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-secondary/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Avatar Pipeline</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-text-secondary/60 mb-3 tracking-wider">Outputs</p>
              <div className="space-y-2">
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-success/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Publish to TikTok</p>
                </div>
                <div className="p-3 border border-border rounded-lg bg-bg cursor-grab hover:border-success/50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Publish to YouTube</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border">
             <Button variant="outline" className="w-full text-xs" size="sm">
               <Plus className="h-4 w-4 mr-1" /> Custom Node
             </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative min-h-0 rounded-xl overflow-hidden shadow-sm">
          <NodeCanvas />
        </div>
      </div>
    </div>
  );
}

;
