// MY STUDIO — NodeTypes.tsx
// PURPOSE: Custom node type definitions for the Workflow Studio React Flow canvas

interface BaseNodeData {
  label: string;
  module: string;
  config: Record<string, unknown>;
}

interface TriggerNodeProps {
  data: BaseNodeData & { triggerType: 'manual' | 'schedule' | 'webhook' };
}

interface ProcessNodeProps {
  data: BaseNodeData & { processType: string };
}

interface OutputNodeProps {
  data: BaseNodeData & { outputType: 'file' | 'notification' | 'publish' };
}

export function TriggerNode({ data }: TriggerNodeProps) {
  void data;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
      <p className="text-xs text-text-secondary">TODO: Implement TriggerNode</p>
    </div>
  );
}

export function ProcessNode({ data }: ProcessNodeProps) {
  void data;

  return (
    <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3">
      <p className="text-xs text-text-secondary">TODO: Implement ProcessNode</p>
    </div>
  );
}

export function OutputNode({ data }: OutputNodeProps) {
  void data;

  return (
    <div className="rounded-lg border border-success/30 bg-success/10 p-3">
      <p className="text-xs text-text-secondary">TODO: Implement OutputNode</p>
    </div>
  );
}
