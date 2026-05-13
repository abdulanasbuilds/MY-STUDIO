import { createClient } from '@supabase/supabase-js';

export default {
  async scheduled(event, env, ctx) {
    const supabaseResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rival_profiles?monitoring_active=eq.true&select=id,user_id,platform,analysis_data`,
      { headers: { "apikey": env.SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    const rivals = await supabaseResp.json();
    
    for (const rival of rivals) {
      const postsResp = await fetch(
        `${env.SUPABASE_URL}/rest/v1/rival_posts?rival_id=eq.${rival.id}&is_popping_off=eq.true&order=discovered_at.desc&limit=3`,
        { headers: { "apikey": env.SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
      );
      const poppingPosts = await postsResp.json();
      
      for (const post of poppingPosts) {
        const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
        if (post.discovered_at > twentyFourHoursAgo) {
          await fetch(`${env.SUPABASE_URL}/rest/v1/notifications`, {
            method: "POST",
            headers: {
              "apikey": env.SUPABASE_SERVICE_KEY,
              "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              user_id: rival.user_id,
              type: "rival_viral",
              title: "🔴 Competitor going viral",
              message: `A tracked account just posted: "${post.title?.slice(0, 60)}..." — ${post.views?.toLocaleString()} views`,
              data: { rival_id: rival.id, post_url: post.post_url, views: post.views }
            })
          });
        }
      }
    }
  }
};
