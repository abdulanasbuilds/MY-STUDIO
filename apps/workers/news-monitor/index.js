// MY STUDIO — News Monitor Worker
// PURPOSE: Ingest news from RSS feeds and Firecrawl for News Studio (M07)
// CONNECTS TO: Supabase (store articles), Modal (analyze with Gemini)

import { createClient } from '@supabase/supabase-js';

export default {
  async scheduled(event, env, ctx) {
    console.log('News monitor cron triggered at', new Date().toISOString());
    await runNewsMonitor(env);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.searchParams.get('key') !== env.WORKER_SECRET_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    ctx.waitUntil(runNewsMonitor(env));
    return new Response(JSON.stringify({ status: 'started', worker: 'news-monitor' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

async function runNewsMonitor(env) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // In production: Fetch from configured RSS feeds, scrape content using Firecrawl
    console.log('Fetching news from feeds...');

    const mockNewsArticles = [
      {
        source: 'TechCrunch',
        url: `https://techcrunch.com/mock-article-${Date.now()}`,
        title: 'OpenAI releases new reasoning model',
        summary: 'A new model capable of extended chain-of-thought has been launched.',
        published_at: new Date().toISOString(),
      },
      {
        source: 'The Verge',
        url: `https://theverge.com/mock-article-${Date.now()}`,
        title: 'Apple announces new generative features',
        summary: 'Apple Intelligence expands to more devices globally.',
        published_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    console.log(`Found ${mockNewsArticles.length} new articles.`);

    // In production, we'd store these into a `news_articles` table or trigger Modal
    // to auto-generate a news video via avatar if it meets high priority thresholds.
    console.log('News ingest cycle completed.');

  } catch (error) {
    console.error('News Monitor failed:', error);
  }
}
