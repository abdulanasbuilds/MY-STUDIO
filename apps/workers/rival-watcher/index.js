// MY STUDIO — Rival Watcher Worker
// PURPOSE: Monitor competitor accounts for Rival Radar (M14)
// CONNECTS TO: Supabase (store competitor data), YouTube/Social APIs (fetch competitor metrics)

import { createClient } from '@supabase/supabase-js';

export default {
  async scheduled(event, env, ctx) {
    console.log('Rival watcher cron triggered at', new Date().toISOString());
    await runRivalCheck(env);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Simple auth
    if (url.searchParams.get('key') !== env.WORKER_SECRET_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    ctx.waitUntil(runRivalCheck(env));
    
    return new Response(JSON.stringify({ status: 'started', worker: 'rival-watcher' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

async function runRivalCheck(env) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    // 1. Fetch all active rival profiles
    const { data: rivals, error: fetchError } = await supabase
      .from('rival_profiles')
      .select('*')
      .eq('monitoring_active', true);
      
    if (fetchError || !rivals || rivals.length === 0) {
      console.log('No active rivals to monitor.');
      return;
    }
    
    console.log(`Checking ${rivals.length} active rivals...`);
    
    // 2. Process each rival (simulated API fetch)
    for (const rival of rivals) {
      // In production: Call YouTube/TikTok API to get latest videos for this rival
      // For prototype: Simulate finding a new high-performing video occasionally
      
      const foundNewVideo = Math.random() > 0.5; // 50% chance to find something new
      
      if (foundNewVideo) {
        const isViral = Math.random() > 0.7;
        const mockPost = {
          rival_id: rival.id,
          user_id: rival.user_id,
          post_url: `https://${rival.platform}.com/post/mock_${Date.now()}`,
          thumbnail_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=640&auto=format&fit=crop',
          title: `New insight on ${rival.name}`,
          views: Math.floor(10000 + Math.random() * 500000),
          likes: Math.floor(500 + Math.random() * 25000),
          comments: Math.floor(50 + Math.random() * 2500),
          shares: Math.floor(10 + Math.random() * 500),
          engagement_rate: 3.5 + Math.random() * 4.0,
          views_per_hour: 1000 + Math.random() * 5000,
          is_viral: isViral,
          is_popping_off: isViral,
          viral_score: isViral ? (80 + Math.random() * 20) : (40 + Math.random() * 30),
          why_it_worked: isViral ? "Strong hook and high retention." : null,
          hook_type: "Curiosity Gap",
        };
        
        await supabase.from('rival_posts').insert([mockPost]);
        
        // If it's popping off, send an alert notification
        if (isViral) {
          await supabase.from('notifications').insert([{
            user_id: rival.user_id,
            type: 'rival_alert',
            title: `Rival Alert: ${rival.name} is popping off`,
            message: `A new post by ${rival.name} is performing exceptionally well.`,
            data: { rival_id: rival.id, post_url: mockPost.post_url }
          }]);
        }
      }
      
      // Update last checked timestamp
      await supabase
        .from('rival_profiles')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', rival.id);
    }
    
    console.log('Rival check complete.');
    
  } catch (error) {
    console.error('Rival check failed:', error);
  }
}
