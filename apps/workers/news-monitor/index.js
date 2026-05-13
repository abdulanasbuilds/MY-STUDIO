// MY STUDIO — News Monitor Worker
import { createClient } from '@supabase/supabase-js';

export default {
  async scheduled(event, env, ctx) {
    console.log('News monitor cron triggered');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    const RSS_FEEDS = [
      "https://techcrunch.com/feed/",
      "https://www.theverge.com/rss/index.xml"
    ];
    
    for (const feed of RSS_FEEDS) {
        // Simulated RSS fetch & parse
        const mockItem = {
            title: "Breaking AI News",
            url: "https://example.com/news",
            summary: "New model dropped",
            category: "Tech",
            published_at: new Date().toISOString()
        };
        await supabase.from("news_queue").insert([mockItem]);
    }
  },
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({ status: 'ok', worker: 'news-monitor' }), { headers: { 'Content-Type': 'application/json' } });
  },
};
