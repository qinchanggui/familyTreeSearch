"use client";

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
  NodeProps,
  Handle,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FamilyData, Person } from '@/types/family';

interface TreeViewProps {
  data: FamilyData;
}

// 节点：字体正常大小，紧凑排列
function PersonNode({ data }: NodeProps) {
  return (
    <div
      className="px-3 py-2 rounded-lg bg-white border-2 shadow-sm min-w-[70px] max-w-[180px] hover:shadow-md transition-shadow"
      style={{ borderColor: data.borderColor || '#93c5fd' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <div className="text-center">
        <p className="font-bold text-gray-800 text-sm leading-tight whitespace-nowrap">{data.label}</p>
        {data.info && (
          <p className="text-gray-500 text-xs mt-1 leading-snug line-clamp-2">{data.info}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

const generationColors = [
  '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
  '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
  '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa',
];

// 水平间距：按名字宽度估算
const NODE_H_GAP = 160;   // 兄弟节点水平最小间距
const NODE_V_GAP = 60;    // 父子垂直间距（紧凑）
const NODE_HALF_W = 50;   // 节点半宽偏移

function getSubtreeWidth(person: Person): number {
  if (!person.children || person.children.length === 0) return 1;
  return person.children.reduce((sum, c) => sum + getSubtreeWidth(c), 0);
}

interface LayoutResult {
  id: string;
  name: string;
  info: string;
  x: number;
  y: number;
  borderColor: string;
  children: LayoutResult[];
}

function layoutTree(person: Person, x: number, y: number, depth: number): LayoutResult {
  const children = person.children || [];
  const borderColor = generationColors[depth % generationColors.length];

  if (children.length === 0) {
    return { id: person.id || '', name: person.name, info: person.info || '', x, y, borderColor, children: [] };
  }

  const childWidths = children.map(c => getSubtreeWidth(c));
  const totalUnits = childWidths.reduce((a, b) => a + b, 0);
  const totalSpan = totalUnits * NODE_H_GAP;

  const layoutChildren: LayoutResult[] = [];
  let cx = x - totalSpan / 2;

  for (let i = 0; i < children.length; i++) {
    const childCenter = cx + (childWidths[i] * NODE_H_GAP) / 2;
    layoutChildren.push(layoutTree(children[i], childCenter, y + NODE_V_GAP, depth + 1));
    cx += childWidths[i] * NODE_H_GAP;
  }

  const parentX = (layoutChildren[0].x + layoutChildren[layoutChildren.length - 1].x) / 2;
  return { id: person.id || '', name: person.name, info: person.info || '', x: parentX, y, borderColor, children: layoutChildren };
}

function toElements(layout: LayoutResult): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  (function walk(ln: LayoutResult) {
    nodes.push({
      id: ln.id,
      type: 'person',
      position: { x: ln.x - NODE_HALF_W, y: ln.y },
      data: { label: ln.name, info: ln.info, borderColor: ln.borderColor },
    });
    for (const ch of ln.children) {
      edges.push({
        id: `${ln.id}-${ch.id}`,
        source: ln.id,
        target: ch.id,
        type: 'smoothstep',
        style: { stroke: '#93c5fd', strokeWidth: 2 },
      });
      walk(ch);
    }
  })(layout);

  return { nodes, edges };
}

export default function TreeView({ data }: TreeViewProps) {
  const rootPeople = data.generations[0]?.people || [];

  const { initialNodes, initialEdges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    for (const person of rootPeople) {
      const layout = layoutTree(person, 0, 0, 0);
      const { nodes, edges } = toElements(layout);

      // 偏移多棵子树使其不相交
      if (allNodes.length > 0) {
        const maxX = Math.max(...allNodes.map(n => n.position.x + NODE_HALF_W * 2));
        const minX = Math.min(...nodes.map(n => n.position.x));
        const shift = maxX + NODE_H_GAP * 0.4 - minX;
        nodes.forEach(n => (n.position.x += shift));
      }

      allNodes.push(...nodes);
      allEdges.push(...edges);
    }

    return { initialNodes: allNodes, initialEdges: allEdges };
  }, [rootPeople]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  if (rootPeople.length === 0) {
    return (
      <div className="w-full bg-white shadow-sm p-6 text-center text-gray-400">
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-gray-400">双指缩放 · 拖拽移动</p>
        </div>
        <div className="w-full h-[70vh] sm:h-[80vh]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.05}
            maxZoom={3}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls
              showInteractive={false}
              position="bottom-right"
              className="!bg-white !rounded-lg !shadow-md !border !border-gray-200"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
