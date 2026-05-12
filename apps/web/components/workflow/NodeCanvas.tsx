'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Edge,
  Node,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode, ProcessNode, OutputNode } from './NodeTypes';
import { AnimatedEdge } from './EdgeTypes';

const nodeTypes = {
  trigger: TriggerNode,
  process: ProcessNode,
  output: OutputNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 50, y: 150 },
    data: { label: 'New RSS Item', module: 'RSS Feed' },
  },
  {
    id: '2',
    type: 'process',
    position: { x: 350, y: 50 },
    data: { label: 'Firecrawl Scrape', module: 'firecrawl' },
  },
  {
    id: '3',
    type: 'process',
    position: { x: 350, y: 250 },
    data: { label: 'Gemini Summary', module: 'gemini' },
  },
  {
    id: '4',
    type: 'output',
    position: { x: 650, y: 150 },
    data: { label: 'Avatar Broadcast', module: 'avatar_studio' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', type: 'animated', style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'animated', style: { stroke: '#6366f1', strokeWidth: 2 } },
];

export function NodeCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  return (
    <div className="h-full w-full bg-bg rounded-xl overflow-hidden border border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#333" />
        <Controls className="bg-surface-1 border-border fill-text-primary" />
      </ReactFlow>
    </div>
  );
}
