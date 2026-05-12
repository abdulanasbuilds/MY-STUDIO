// MY STUDIO — VideoPlayer.tsx
// PURPOSE: Video player component with playback controls for previewing generated content

interface VideoPlayerProps {
  src: string | null;
  poster: string | null;
  autoPlay: boolean;
  onTimeUpdate: (currentTime: number) => void;
  onEnded: () => void;
}

export function VideoPlayer({ src, poster, autoPlay, onTimeUpdate, onEnded }: VideoPlayerProps) {
  void src;
  void poster;
  void autoPlay;
  void onTimeUpdate;
  void onEnded;

  return (
    <div className="aspect-video w-full rounded-xl border border-border bg-surface-1 flex items-center justify-center">
      <p className="text-sm text-text-secondary">TODO: Implement VideoPlayer component</p>
    </div>
  );
}
