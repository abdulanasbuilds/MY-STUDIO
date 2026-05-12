// MY STUDIO — EdgeTypes.tsx
// PURPOSE: Custom edge type definitions for the Workflow Studio React Flow canvas

interface AnimatedEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  style: Record<string, string | number>;
}

export function AnimatedEdge({ id, sourceX, sourceY, targetX, targetY, style }: AnimatedEdgeProps) {
  void id;
  void sourceX;
  void sourceY;
  void targetX;
  void targetY;
  void style;

  return (
    <g>
      {/* TODO: Implement custom animated edge with SVG path */}
      <text className="text-xs fill-text-secondary">TODO: Implement AnimatedEdge</text>
    </g>
  );
}

interface ConditionalEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  label: string;
}

export function ConditionalEdge({ id, sourceX, sourceY, targetX, targetY, label }: ConditionalEdgeProps) {
  void id;
  void sourceX;
  void sourceY;
  void targetX;
  void targetY;
  void label;

  return (
    <g>
      {/* TODO: Implement conditional edge with label */}
      <text className="text-xs fill-text-secondary">TODO: Implement ConditionalEdge</text>
    </g>
  );
}
