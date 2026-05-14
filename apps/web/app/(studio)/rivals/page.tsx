'use client';

// MY STUDIO — Rival Intel Page
// PURPOSE: Full UI for Rivals Dashboard (M06)

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  TrendingUp,
  Activity,
  Play,
  ArrowUpRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

// Mock data until Supabase connection is wired up to real data
const MOCK_RIVALS = [
  {
    id: '1',
    name: 'Tech Influencer X',
    platform: 'youtube',
    username: '@techX',
    profile_url: 'https://youtube.com/@techX',
    follower_count: 1250000,
    monitoring_active: true,
    last_checked_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'SaaS Builder Y',
    platform: 'twitter',
    username: '@saasbuilder',
    profile_url: 'https://twitter.com/saasbuilder',
    follower_count: 85000,
    monitoring_active: true,
    last_checked_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    name: 'AI Creator Z',
    platform: 'tiktok',
    username: '@aicreatorz',
    profile_url: 'https://tiktok.com/@aicreatorz',
    follower_count: 540000,
    monitoring_active: false,
    last_checked_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_ALERTS = [
  {
    id: 'a1',
    rival_name: 'Tech Influencer X',
    title: 'New viral video detected: "The AI Bubble"',
    views: 850000,
    score: 92,
    time: '2 hours ago',
  },
  {
    id: 'a2',
    rival_name: 'SaaS Builder Y',
    title: 'High engagement thread on pricing models',
    views: 45000,
    score: 88,
    time: '5 hours ago',
  },
];

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [rivals, setRivals] = useState(MOCK_RIVALS);
  
  const filteredRivals = rivals.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Rival Intel</h1>
          <p className="mt-2 text-text-secondary">
            Monitor your competitors automatically and get alerted when they post viral content.
          </p>
        </div>
        <Button variant="primary">
          <Plus className="mr-2 h-4 w-4" /> Add Rival
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        {/* Main content - Rivals List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/50" />
              <input
                type="text"
                placeholder="Search rivals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-1 py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 border-b border-border bg-surface-2/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
              <div className="col-span-5">Competitor</div>
              <div className="col-span-3">Audience</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-border">
              {filteredRivals.map((rival) => (
                <div key={rival.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-2/30">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-secondary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{rival.name}</p>
                      <a 
                        href={rival.profile_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors truncate"
                      >
                        {rival.username} <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <p className="font-medium text-text-primary">{formatNumber(rival.follower_count)}</p>
                    <p className="text-xs text-text-secondary capitalize">{rival.platform}</p>
                  </div>
                  
                  <div className="col-span-3">
                    {rival.monitoring_active ? (
                        <div className="flex items-center gap-1.5 text-xs text-success">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
                            </span>
                            Monitoring
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary/60">
                            <span className="h-2 w-2 rounded-full bg-text-secondary/40"></span>
                            Paused
                        </div>
                    )}
                    <p className="text-[10px] text-text-secondary mt-1">Checked: {getTimeAgo(rival.last_checked_at)}</p>
                  </div>
                  
                  <div className="col-span-1 flex justify-end gap-2">
                    <button className="text-text-secondary hover:text-primary transition-colors p-1" title="Refresh data">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button className="text-text-secondary hover:text-error transition-colors p-1" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredRivals.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-text-secondary">
                  No rivals found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Alerts & Insights */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Recent Alerts</h2>
            </div>
            
            <div className="space-y-4">
              {MOCK_ALERTS.map(alert => (
                <div key={alert.id} className="border-l-2 border-primary/50 pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-text-secondary">{alert.rival_name}</p>
                    <span className="text-[10px] text-text-secondary/60">{alert.time}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1 leading-snug">{alert.title}</p>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1 text-primary">
                        <TrendingUp className="h-3 w-3" /> Score: {alert.score}
                    </span>
                    <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" /> {formatNumber(alert.views)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
                <Button variant="outline" className="w-full text-xs" size="sm">
                    View All Alerts
                </Button>
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-surface-1 p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">How Rival Radar Works</h2>
              <ul className="space-y-3 text-xs text-text-secondary">
                  <li className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                      Add your top competitors to the tracker.
                  </li>
                  <li className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                      Our agents check their accounts daily for new posts.
                  </li>
                  <li className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                      When a post performs &gt;200% above their average, you get an alert.
                  </li>
              </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

;
