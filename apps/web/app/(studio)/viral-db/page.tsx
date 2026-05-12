'use client';

// MY STUDIO — Viral DB Page
// PURPOSE: Full UI for Viral Database module (M13)
// DISPLAYS: Shared viral content discovered by the Viral Hunter worker

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Play,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Flame,
} from 'lucide-react';

import { cn } from '@/lib/cn';

// Simulated data since we don't have real worker data yet
const MOCK_VIRAL_DATA = [
  {
    id: '1',
    platform: 'youtube',
    title: 'How I Built a $10K/mo SaaS in 30 Days (No Code)',
    creator_handle: '@nocodefounder',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    views: 1200000,
    likes: 85000,
    comments: 3200,
    shares: 450,
    viral_score: 94,
    niches: ['saas', 'business', 'tech'],
    hook_type: 'Income Claim + Time Constraint',
    is_trending: true,
    discovered_at: new Date().toISOString(),
  },
  {
    id: '2',
    platform: 'tiktok',
    title: 'The exact framework I use to script viral TikToks',
    creator_handle: '@creatorgrowth',
    thumbnail_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&auto=format&fit=crop&q=60',
    views: 4500000,
    likes: 520000,
    comments: 12400,
    shares: 1250,
    viral_score: 98,
    niches: ['marketing', 'creator'],
    hook_type: 'Authority + "Exact Framework"',
    is_trending: true,
    discovered_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    platform: 'instagram',
    title: '3 AI tools that will replace your marketing agency',
    creator_handle: '@aimarketer',
    thumbnail_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
    views: 890000,
    likes: 42000,
    comments: 890,
    shares: 140,
    viral_score: 88,
    niches: ['ai', 'marketing'],
    hook_type: 'Fear/Replacement + List',
    is_trending: false,
    discovered_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export function ViralDBPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNiche, setActiveNiche] = useState<string>('all');
  
  // Extract all unique niches
  const allNiches = ['all', ...Array.from(new Set(MOCK_VIRAL_DATA.flatMap(item => item.niches)))];

  const filteredData = MOCK_VIRAL_DATA.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.creator_handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = activeNiche === 'all' || item.niches.includes(activeNiche);
    return matchesSearch && matchesNiche;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Viral Database</h1>
          <p className="mt-2 text-text-secondary">
            Constantly updated library of viral content discovered by our AI agents.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="rounded-lg border border-border bg-surface-1 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase text-text-secondary/60">Indexed</p>
            <p className="text-lg font-bold text-text-primary">12,450</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase text-text-secondary/60">Trending</p>
            <p className="text-lg font-bold text-primary">142</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/50" />
          <input
            type="text"
            placeholder="Search topics, creators, or hooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-1 py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 mr-2 text-sm text-text-secondary">
            <Filter className="h-4 w-4" /> Filter:
          </div>
          {allNiches.map(niche => (
            <button
              key={niche}
              onClick={() => setActiveNiche(niche)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                activeNiche === niche
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface-1 text-text-secondary hover:bg-surface-2"
              )}
            >
              {niche}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredData.map((item) => (
          <div key={item.id} className="group overflow-hidden rounded-xl border border-border bg-surface-1 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
            {/* Thumbnail area */}
            <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
              <img 
                src={item.thumbnail_url} 
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                <button className="rounded-full bg-primary p-3 text-white shadow-lg transition-transform hover:scale-110">
                  <Play className="h-5 w-5 fill-current" />
                </button>
              </div>
              
              {/* Badges */}
              <div className="absolute left-3 top-3 flex gap-2">
                {item.is_trending && (
                  <span className="flex items-center gap-1 rounded bg-error px-2 py-1 text-xs font-bold text-white shadow-sm">
                    <TrendingUp className="h-3 w-3" /> Trending
                  </span>
                )}
              </div>
              <div className="absolute right-3 top-3">
                <span className="flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-bold text-primary backdrop-blur-sm border border-primary/30">
                  <Flame className="h-3 w-3" /> Score {item.viral_score}
                </span>
              </div>
            </div>

            {/* Content area */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">{item.creator_handle}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">{item.platform}</span>
              </div>
              
              <h3 className="mb-3 line-clamp-2 text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              
              <div className="mb-4 rounded bg-surface-2 p-2">
                <p className="text-[10px] font-medium uppercase text-text-secondary/60 mb-0.5">Hook Type</p>
                <p className="text-xs text-text-primary">{item.hook_type}</p>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-medium text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  {formatNumber(item.views)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  {formatNumber(item.likes)}
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {formatNumber(item.comments)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  {formatNumber(item.shares)}
                </div>
              </div>
              
              {/* Action */}
              <div className="mt-4 pt-4 border-t border-border">
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                      Remix this video
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredData.length === 0 && (
          <div className="py-12 text-center text-text-secondary">
              No viral content found matching your search.
          </div>
      )}
    </div>
  );
}

export { ViralDBPage as default };
