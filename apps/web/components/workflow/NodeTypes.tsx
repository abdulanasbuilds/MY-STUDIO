import { Handle, Position } from '@xyflow/react';
import { Play, Settings2, Webhook, Clock, Zap, FileText } from 'lucide-react';

interface BaseNodeData {
  label: string;
  module: string;
}

export function TriggerNode({ data }: { data: BaseNodeData }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-primary/50 bg-surface-1 shadow-lg overflow-hidden">
      <div className="bg-primary/10 px-3 py-2 border-b border-primary/20 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Trigger</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-text-primary">{data.label}</p>
        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
          {data.module === 'webhook' ? <Webhook className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {data.module}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary" />
    </div>
  );
}

export function ProcessNode({ data }: { data: BaseNodeData }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-secondary/50 bg-surface-1 shadow-lg overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-secondary" />
      <div className="bg-secondary/10 px-3 py-2 border-b border-secondary/20 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-secondary" />
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">Action</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-text-primary">{data.label}</p>
        <p className="text-xs text-text-secondary mt-1">{data.module}</p>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-secondary" />
    </div>
  );
}

export function OutputNode({ data }: { data: BaseNodeData }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-success/50 bg-surface-1 shadow-lg overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-success" />
      <div className="bg-success/10 px-3 py-2 border-b border-success/20 flex items-center gap-2">
        <Play className="h-4 w-4 text-success" />
        <span className="text-xs font-bold uppercase tracking-wider text-success">Output</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-text-primary">{data.label}</p>
        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
          <FileText className="h-3 w-3" /> {data.module}
        </p>
      </div>
    </div>
  );
}
