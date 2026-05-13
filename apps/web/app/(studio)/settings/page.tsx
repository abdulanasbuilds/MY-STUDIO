'use client';

// MY STUDIO — Settings Page

import { useState } from 'react';
import { User, Shield, CreditCard, Sparkles, Sliders, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('human-feel');
  const [hfEnabled, setHfEnabled] = useState(true);
  const [preset, setPreset] = useState('social_media');
  const [grain, setGrain] = useState(8);

  const TABS = [
    { id: 'profile', label: 'Avatar Profiles', icon: User },
    { id: 'human-feel', label: 'Human Feel Engine', icon: Sparkles },
    { id: 'account', label: 'Account Security', icon: Shield },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="mt-2 text-text-secondary">Manage your studio preferences and AI configurations.</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                isActive ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'human-feel' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Human Feel Processing
                </h2>
                <p className="text-sm text-text-secondary mt-1">Automatically apply professional post-production rules to all generated videos to make them feel organic and human-made.</p>
              </div>
              <label className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface-3 cursor-pointer">
                 <input type="checkbox" className="sr-only" checked={hfEnabled} onChange={(e) => setHfEnabled(e.target.checked)} />
                 <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition", hfEnabled ? "translate-x-5 bg-primary" : "translate-x-1")} />
              </label>
            </div>

            <div className={cn("grid gap-8 lg:grid-cols-2 pt-6 transition-opacity", !hfEnabled && "opacity-50 pointer-events-none")}>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">Quality Preset</label>
                  <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text-primary focus:border-primary focus:outline-none">
                    <option value="social_media">Social Media (Punchy, High Engagement)</option>
                    <option value="cinematic">Cinematic (Orange/Teal, Dramatic)</option>
                    <option value="documentary">Documentary (Desaturated, Neutral)</option>
                    <option value="raw_authentic">Raw & Authentic (Subtle, Minimal)</option>
                    <option value="broadcast_news">Broadcast News (Clean, Cool)</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2"><Sliders className="h-4 w-4" /> Custom Overrides</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-text-secondary">Film Grain Intensity</label>
                        <span className="text-sm text-primary font-medium">{grain}</span>
                      </div>
                      <input type="range" min="0" max="20" value={grain} onChange={(e) => setGrain(parseInt(e.target.value))} className="w-full accent-primary" />
                    </div>

                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-text-secondary">Audio Warmth (EQ + Sub-Reverb)</span>
                        <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-text-secondary">Subtle Camera Movement</span>
                        <input type="checkbox" defaultChecked={preset==='cinematic'} className="accent-primary w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-text-secondary">Insert Breathing Room (Pauses)</span>
                        <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-text-secondary">Micro-Timing Variance</span>
                        <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-bg p-5 flex flex-col items-center justify-center text-center">
                 <div className="w-full aspect-video bg-surface-2 rounded-lg mb-4 flex items-center justify-center border border-border">
                    <p className="text-text-secondary/50 text-sm">Upload a test clip to preview settings</p>
                 </div>
                 <Button variant="outline" className="w-full">Upload 10s Test Clip</Button>
                 <Button className="w-full mt-2" variant="primary">Apply & Preview</Button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Button variant="primary"><CheckCircle className="h-4 w-4 mr-2"/> Save Preferences</Button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab !== 'human-feel' && (
        <div className="rounded-xl border border-border bg-surface-1 p-12 text-center">
            <p className="text-text-secondary">This section is coming soon.</p>
        </div>
      )}
    </div>
  );
}

export { SettingsPage as default };
