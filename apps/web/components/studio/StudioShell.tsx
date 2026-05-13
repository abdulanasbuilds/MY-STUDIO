'use client';

// MY STUDIO — StudioShell.tsx
// PURPOSE: Client-side app shell with sidebar navigation, receives feature flags from server layout

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Film,
  BookOpen,
  Scissors,
  RefreshCw,
  Search,
  Newspaper,
  GitBranch,
  Music,
  Image,
  Clapperboard,
  Sparkles,
  Database,
  Eye,
  Languages,
  FolderOpen,
  Settings,
  Menu,
  X,
  Wand2,
} from 'lucide-react';

import { cn } from '@/lib/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
  group: 'Create' | 'Grow' | 'Automate' | 'Enhance' | 'System';
}

const NAV_ITEMS: NavItem[] = [
  // Create
  { label: 'Avatar Studio', href: '/avatar', icon: User, key: 'avatar', group: 'Create' },
  { label: 'Movie Generator', href: '/movie', icon: Film, key: 'movie', group: 'Create' },
  { label: 'Documentary', href: '/documentary', icon: BookOpen, key: 'documentary', group: 'Create' },
  { label: 'Editor', href: '/editor', icon: Scissors, key: 'editor', group: 'Create' },
  // Grow
  { label: 'Content Remix', href: '/remix', icon: RefreshCw, key: 'remix', group: 'Grow' },
  { label: 'Rival Intel', href: '/rivals', icon: Search, key: 'rivals', group: 'Grow' },
  { label: 'News Studio', href: '/news', icon: Newspaper, key: 'news', group: 'Grow' },
  { label: 'Clipper', href: '/clipper', icon: Clapperboard, key: 'clipper', group: 'Grow' },
  // Automate
  { label: 'Workflow', href: '/workflow', icon: GitBranch, key: 'workflow', group: 'Automate' },
  { label: 'Audio Studio', href: '/audio', icon: Music, key: 'audio', group: 'Automate' },
  { label: 'Thumbnails', href: '/thumbnails', icon: Image, key: 'thumbnails', group: 'Automate' },
  { label: 'Remixer', href: '/remixer', icon: Sparkles, key: 'remixer', group: 'Automate' },
  // Enhance
  { label: 'Viral DB', href: '/viral-db', icon: Database, key: 'viral-db', group: 'Enhance' },
  { label: 'Spy', href: '/spy', icon: Eye, key: 'spy', group: 'Enhance' },
  { label: 'Dubbing', href: '/dubbing', icon: Languages, key: 'dubbing', group: 'Enhance' },
  { label: 'Human Feel', href: '/human-feel', icon: Wand2, key: 'human-feel', group: 'Enhance' },
  // System
  { label: 'Library', href: '/library', icon: FolderOpen, key: 'library', group: 'System' },
  { label: 'Settings', href: '/settings', icon: Settings, key: 'settings', group: 'System' },
];

const GROUPS: Array<{ label: string; key: NavItem['group'] }> = [
  { label: 'Create', key: 'Create' },
  { label: 'Grow', key: 'Grow' },
  { label: 'Automate', key: 'Automate' },
  { label: 'Enhance', key: 'Enhance' },
  { label: 'System', key: 'System' },
];

// Bottom bar items for mobile — show key modules only
const MOBILE_NAV_KEYS = ['avatar', 'library', 'workflow', 'settings'];

interface StudioShellProps {
  featureFlags: Record<string, boolean>;
  children: React.ReactNode;
}

export function StudioShell({ featureFlags, children }: StudioShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSidebarOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-1 transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/avatar" className="text-lg font-bold text-text-primary">
            MY STUDIO
          </Link>
          <button
            className="text-text-secondary lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((item) => item.group === group.key);
            if (items.length === 0) return null;

            return (
              <div key={group.key} className="mb-6">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const enabled = featureFlags[item.key] ?? false;
                    if (!enabled) return null; // Completely hides disabled features

                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex h-14 items-center border-b border-border bg-surface-1 px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-5 w-5 text-text-secondary" />
          </button>
          <span className="ml-4 text-sm font-semibold text-text-primary">MY STUDIO</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        {/* Bottom tab bar (mobile) */}
        <nav className="flex border-t border-border bg-surface-1 lg:hidden">
          {NAV_ITEMS.filter((item) => MOBILE_NAV_KEYS.includes(item.key)).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                  active ? 'text-primary' : 'text-text-secondary',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
