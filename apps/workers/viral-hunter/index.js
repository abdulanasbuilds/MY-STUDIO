// MY STUDIO — Viral Hunter Worker
// PURPOSE: Background job to fetch trending videos, score them, and store in Viral DB
// DEPLOY: npx wrangler deploy

import { createClient } from '@supabase/supabase-js';

export default {
  // Cron trigger (e.g., runs every hour)
  async scheduled(event, env, ctx) {
    console.log('Viral hunter cron triggered at', new Date().toISOString());
    await runViralHunt(env);
  },

  // HTTP trigger for manual runs/testing
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Simple auth for manual triggers
    if (url.searchParams.get('key') !== env.WORKER_SECRET_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    ctx.waitUntil(runViralHunt(env));
    
    return new Response(JSON.stringify({ status: 'started', worker: 'viral-hunter' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

async function runViralHunt(env) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    // In production, this would call YouTube Data API, TikTok API (via Apify/Firecrawl), etc.
    // to find trending videos in specific niches.
    // For this prototype, we'll simulate finding a trending video.
    
    console.log('Fetching trending content...');
    
    // Simulated viral video data
    const niches = ['tech', 'ai', 'productivity', 'finance', 'creator_economy'];
    const randomNiche = niches[Math.floor(Math.random() * niches.length)];
    const randomScore = 75 + Math.random() * 20; // 75-95
    
    const mockViralContent = {
      platform: 'youtube',
      content_url: `https://youtube.com/watch?v=mock_${Date.now()}`,
      thumbnail_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=640&auto=format&fit=crop',
      title: `How I use AI for ${randomNiche} (Secret Strategy)`,
      creator_handle: '@mockcreator',
      creator_followers: 250000,
      niches: [randomNiche, 'strategy'],
      views: Math.floor(100000 + Math.random() * 900000),
      likes: Math.floor(5000 + Math.random() * 45000),
      comments: Math.floor(500 + Math.random() * 4500),
      shares: Math.floor(100 + Math.random() * 900),
      engagement_rate: 4.5 + Math.random() * 3.0,
      views_per_hour: 5000 + Math.random() * 15000,
      hook_type: 'Pattern Interrupt + Bold Claim',
      viral_triggers: ['Curiosity Gap', 'Authority', 'Actionable Value'],
      viral_score: randomScore,
      is_trending: true,
      trend_score: randomScore * 1.2,
      week_number: getWeekNumber(new Date()),
    };
    
    console.log(`Found trending video: ${mockViralContent.title}`);
    
    // Insert into Supabase viral_content table
    const { error } = await supabase
      .from('viral_content')
      .insert([mockViralContent]);
      
    if (error) {
      // If it's a unique constraint violation on URL, that's fine
      if (error.code !== '23505') {
        console.error('Supabase insert error:', error);
      } else {
        console.log('Video already exists in Viral DB.');
      }
    } else {
      console.log('Successfully saved to Viral DB.');
      
      // Optionally notify users subscribed to this niche
      // (Implementation requires checking user preferences)
    }
    
  } catch (error) {
    console.error('Viral Hunt failed:', error);
  }
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
