// MY STUDIO — PlatformPreview.tsx
// PURPOSE: Preview how content will appear on different platforms (YouTube, TikTok, Instagram, etc.)

interface PlatformPreviewProps {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin';
  videoUrl: string | null;
  title: string;
  description: string;
}

export function PlatformPreview({ platform, videoUrl, title, description }: PlatformPreviewProps) {
  void platform;
  void videoUrl;
  void title;
  void description;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <p className="text-sm text-text-secondary">TODO: Implement PlatformPreview component</p>
    </div>
  );
}
