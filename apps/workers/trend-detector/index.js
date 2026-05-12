// MY STUDIO — Trend Detector Worker
// PURPOSE: Serper API trending topics for Trend Engine (M13)
// CONNECTS TO: Supabase (store trends), Serper API (fetch trending topics)

import { createClient } from '@supabase/supabase-js';

export default {
  async scheduled(event, env, ctx) {
    console.log('Trend detector cron triggered at', new Date().toISOString());
    await runTrendDetector(env);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.searchParams.get('key') !== env.WORKER_SECRET_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    ctx.waitUntil(runTrendDetector(env));
    return new Response(JSON.stringify({ status: 'started', worker: 'trend-detector' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

async function runTrendDetector(env) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // In production: Use Google Trends via Serper API to identify breakout searches
    console.log('Fetching Google Trends via Serper...');

    const mockTrends = [
      { topic: 'AGI Timelines', search_volume: 500000, trend_score: 95 },
      { topic: 'Next.js 15 Release', search_volume: 120000, trend_score: 88 },
      { topic: 'Nvidia Earnings', search_volume: 2500000, trend_score: 99 },
    ];

    console.log('Detected trends:', mockTrends);
    
    // In production, store into `trending_topics` table
    console.log('Trend detector cycle completed.');

  } catch (error) {
    console.error('Trend Detector failed:', error);
  }
}
