// MY STUDIO — ClipCard.tsx
// PURPOSE: Individual clip card in the editor timeline or clip list

interface ClipCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ClipCard({ id, title, thumbnailUrl, duration, isSelected, onSelect }: ClipCardProps) {
  void id;
  void title;
  void thumbnailUrl;
  void duration;
  void isSelected;
  void onSelect;

  return (
    <div className="rounded-lg border border-border bg-surface-1 p-3">
      <p className="text-sm text-text-secondary">TODO: Implement ClipCard component</p>
    </div>
  );
}
