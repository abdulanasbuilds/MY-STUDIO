// MY STUDIO — NodeCanvas.tsx
// PURPOSE: React Flow canvas for the Workflow Studio visual automation builder

interface NodeCanvasProps {
  workflowId: string;
  readOnly: boolean;
  onSave: (nodes: unknown[], edges: unknown[]) => void;
}

export function NodeCanvas({ workflowId, readOnly, onSave }: NodeCanvasProps) {
  void workflowId;
  void readOnly;
  void onSave;

  return (
    <div className="h-full w-full rounded-xl border border-border bg-surface-1 p-4">
      <p className="text-sm text-text-secondary">TODO: Implement NodeCanvas component with React Flow</p>
    </div>
  );
}
