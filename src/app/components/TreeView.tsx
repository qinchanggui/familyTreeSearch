"use client";

import { useMemo } from 'react';
import ReactFlow, {
  Node, Edge, Background, Controls,
  useNodesState, useEdgesState,
  Position, NodeProps, Handle, BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FamilyData, Person } from '@/types/family';

interface TreeViewProps { data: FamilyData }

// 节点：只显示名字，大字体
function PersonNode({ data }: NodeProps) {
  return (
    <div
      className="px-5 py-2.5 rounded-xl bg-white border-2 shadow-md hover:shadow-lg transition-shadow"
      style={{ borderColor: data.borderColor || '#93c5fd' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3" />
      <p className="font-bold text-gray-800 text-lg whitespace-nowrap">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3" />
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

const H_GAP = 180;
const V_GAP = 80;

function getWidth(p: Person): number {
  if (!p.children?.length) return 1;
  return p.children.reduce((s, c) => s + getWidth(c), 0);
}

interface L { id: string; name: string; x: number; y: number; bc: string; ch: L[] }

function layout(p: Person, x: number, y: number, d: number): L {
  const bc = generationColors[d % generationColors.length];
  const ch = p.children || [];
  if (!ch.length) return { id: p.id || '', name: p.name, x, y, bc, ch: [] };

  const ws = ch.map(c => getWidth(c));
  const total = ws.reduce((a, b) => a + b, 0) * H_GAP;
  const ls: L[] = [];
  let cx = x - total / 2;
  for (let i = 0; i < ch.length; i++) {
    ls.push(layout(ch[i], cx + ws[i] * H_GAP / 2, y + V_GAP, d + 1));
    cx += ws[i] * H_GAP;
  }
  return { id: p.id || '', name: p.name, x: (ls[0].x + ls[ls.length - 1].x) / 2, y, bc, ch: ls };
}

function toEl(l: L): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [], edges: Edge[] = [];
  const hw = 70;
  (function w(n: L) {
    nodes.push({ id: n.id, type: 'person', position: { x: n.x - hw, y: n.y }, data: { label: n.name, borderColor: n.bc } });
    for (const c of n.ch) {
      edges.push({ id: `${n.id}-${c.id}`, source: n.id, target: c.id, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } });
      w(c);
    }
  })(l);
  return { nodes, edges };
}

export default function TreeView({ data }: TreeViewProps) {
  const roots = data.generations[0]?.people || [];

  const { initialNodes, initialEdges } = useMemo(() => {
    const ns: Node[] = [], es: Edge[] = [];
    for (const p of roots) {
      const { nodes, edges } = toEl(layout(p, 0, 0, 0));
      if (ns.length) {
        const mx = Math.max(...ns.map(n => n.position.x + 100));
        const mn = Math.min(...nodes.map(n => n.position.x));
        nodes.forEach(n => n.position.x += mx + H_GAP * 0.3 - mn);
      }
      ns.push(...nodes); es.push(...edges);
    }
    return { initialNodes: ns, initialEdges: es };
  }, [roots]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  if (!roots.length) return <div className="w-full bg-white shadow-sm p-6 text-center text-gray-400 text-sm">暂无数据</div>;

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
            fitViewOptions={{ padding: 0.08 }}
            minZoom={0.05}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls showInteractive={false} position="bottom-right" className="!bg-white !rounded-lg !shadow-md !border !border-gray-200" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
