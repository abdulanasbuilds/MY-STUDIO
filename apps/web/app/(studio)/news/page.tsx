'use client';

// MY STUDIO — News Studio Page (M07)

import { useState } from 'react';
import { Newspaper, Rss, Bot, Play, Settings2, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Page() {
  const [rssUrl, setRssUrl] = useState('');
  
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">News Studio</h1>
          <p className="mt-2 text-text-secondary">
            Auto-generate breaking news videos using Firecrawl and your digital Avatar.
          </p>
        </div>
        <Button variant="primary">
          <Play className="mr-2 h-4 w-4" /> Start Auto-Pilot
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Source Feeds */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Rss className="h-5 w-5 text-primary" /> Active News Sources
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder="Paste RSS feed URL or website..."
                className="flex-1 rounded-lg border border-border bg-bg p-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Feed
              </Button>
            </div>
            
            <div className="mt-6 divide-y divide-border border border-border rounded-lg overflow-hidden">
                {[
                    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', status: 'active', lastSync: '10m ago' },
                    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', status: 'active', lastSync: '1h ago' }
                ].map((feed, i) => (
                    <div key={i} className="p-4 flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors">
                        <div>
                            <p className="font-medium text-text-primary text-sm">{feed.name}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{feed.url}</p>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 text-xs text-success">
                                <span className="h-2 w-2 rounded-full bg-success"></span> {feed.status}
                            </span>
                            <p className="text-[10px] text-text-secondary mt-1">Sync: {feed.lastSync}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6">
             <div className="flex items-center gap-2 mb-4">
                <Settings2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-text-primary">Automation Settings</h3>
             </div>
             
             <div className="space-y-5">
                 <div>
                     <label className="text-xs font-medium uppercase text-text-secondary/60 mb-2 block">Avatar to use</label>
                     <select className="w-full bg-bg p-2.5 rounded-lg border border-border text-sm text-text-primary focus:border-primary focus:outline-none">
                         <option>Default Avatar</option>
                         <option>News Anchor Desk</option>
                     </select>
                 </div>
                 
                 <div>
                     <label className="text-xs font-medium uppercase text-text-secondary/60 mb-2 block">Auto-publish to</label>
                     <div className="flex flex-wrap gap-2">
                         <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/30 rounded-md text-xs font-medium">TikTok</span>
                         <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/30 rounded-md text-xs font-medium">YouTube Shorts</span>
                     </div>
                 </div>
                 
                 <div className="pt-4 border-t border-border">
                     <label className="flex items-center justify-between cursor-pointer">
                         <span className="text-sm font-medium text-text-primary">Auto-Generate Mode</span>
                         <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary">
                             <span className="inline-block h-4 w-4 translate-x-4 transform rounded-full bg-white transition" />
                         </div>
                     </label>
                     <p className="text-xs text-text-secondary mt-2">When enabled, AI will automatically scrape new articles, summarize them, and render an avatar video instantly.</p>
                 </div>
             </div>
          </div>
          
          <div className="rounded-xl border border-border bg-surface-1 p-5">
              <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-warning" />
                  <p className="text-sm font-medium text-text-primary">Powered by Firecrawl</p>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                  Our workers monitor RSS feeds 24/7. When a story breaks, Firecrawl extracts the full content, Gemini writes a news script, and Avatar Studio generates the broadcast.
              </p>
          </div>
        </div>
      </div>
      
      {/* Recent Auto-Generated */}
      <div>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" /> Generated Broadcasts
          </h2>
          <div className="rounded-xl border border-border bg-surface-1 p-8 text-center">
              <Newspaper className="mx-auto h-12 w-12 text-text-secondary/30 mb-3" />
              <p className="text-text-primary font-medium">No broadcasts generated yet</p>
              <p className="text-sm text-text-secondary mt-1">Add an RSS feed and enable Auto-Generate Mode to start.</p>
          </div>
      </div>
    </div>
  );
}

;
