const VIRAL_THRESHOLD_VIEWS = 100000;
const VIRAL_THRESHOLD_AGE_DAYS = 7;
const YOUTUBE_CATEGORIES = [
  { id: "20", name: "Gaming" },
  { id: "28", name: "Science & Technology" },
  { id: "24", name: "Entertainment" },
  { id: "22", name: "People & Blogs" }
];
const NICHES = ["gaming", "tech", "finance", "comedy", "education", "motivation", "africa", "AI"];

async function fetchYouTubeTrending(env, categoryId) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("videoCategoryId", categoryId);
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("regionCode", "US");
  url.searchParams.set("key", env.YOUTUBE_API_KEY);
  
  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const data = await response.json();
  
  return (data.items || [])
    .filter(item => {
      const views = parseInt(item.statistics?.viewCount || "0");
      const published = new Date(item.snippet?.publishedAt);
      const ageDays = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24);
      return views > VIRAL_THRESHOLD_VIEWS && ageDays <= VIRAL_THRESHOLD_AGE_DAYS;
    })
    .map(item => {
      const views = parseInt(item.statistics?.viewCount || "0");
      const likes = parseInt(item.statistics?.likeCount || "0");
      const comments = parseInt(item.statistics?.commentCount || "0");
      const hoursOld = (Date.now() - new Date(item.snippet?.publishedAt).getTime()) / (1000 * 60 * 60);
      
      return {
        platform: "youtube",
        content_url: `https://youtube.com/watch?v=${item.id}`,
        thumbnail_url: item.snippet?.thumbnails?.high?.url,
        title: item.snippet?.title,
        creator_handle: item.snippet?.channelTitle,
        views, likes, comments, shares: 0,
        engagement_rate: views > 0 ? ((likes + comments) / views * 100) : 0,
        views_per_hour: hoursOld > 0 ? Math.round(views / hoursOld) : 0,
        niches: NICHES.filter(n => (item.snippet?.title + " " + item.snippet?.description).toLowerCase().includes(n)),
        is_trending: views / (hoursOld || 1) > 5000,
        trend_score: Math.min(1, ((views / hoursOld) / 10000) * 0.6 + (views > 0 ? (likes + comments) / views : 0) * 0.4)
      };
    });
}

export default {
  async scheduled(event, env, ctx) {
    let allItems = [];
    for (const category of YOUTUBE_CATEGORIES) {
      try {
        const items = await fetchYouTubeTrending(env, category.id);
        allItems.push(...items);
      } catch (e) {}
    }
    
    const unique = allItems.filter((v,i,a) => a.findIndex(t => t.content_url === v.content_url) === i);
    
    if (unique.length > 0) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/viral_content`, {
        method: "POST",
        headers: {
          "apikey": env.SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(unique)
      });
    }
  },
  async fetch(request, env) {
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname === "/trigger") {
        await this.scheduled(null, env, null);
        return new Response(JSON.stringify({ status: "triggered" }), { headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response("Nexus Viral Hunter Worker", { status: 200 });
  }
};
