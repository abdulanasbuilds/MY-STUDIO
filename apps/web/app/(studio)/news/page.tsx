// MY STUDIO — News Studio Page

import { ComingSoon } from '@/components/ui/ComingSoon';

export function NewsPage() {
  return (
    <ComingSoon
      module="News Studio"
      description="Auto-generate news content from RSS feeds using Firecrawl, Gemini, and avatar auto-posting."
    />
  );
}

export { NewsPage as default };
