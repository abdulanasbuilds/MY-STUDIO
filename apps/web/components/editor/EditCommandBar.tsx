// MY STUDIO — EditCommandBar.tsx
// PURPOSE: Natural language command bar for the Professional Editor module

interface EditCommandBarProps {
  onCommand: (command: string) => void;
  isProcessing: boolean;
  history: Array<{ command: string; result: string }>;
}

export function EditCommandBar({ onCommand, isProcessing, history }: EditCommandBarProps) {
  void onCommand;
  void isProcessing;
  void history;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <p className="text-sm text-text-secondary">TODO: Implement EditCommandBar component</p>
    </div>
  );
}
