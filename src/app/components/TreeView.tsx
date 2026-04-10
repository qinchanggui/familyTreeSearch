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

function PersonNode({ data }: NodeProps) {
  return (
    <div
      className="px-5 py-2.5 rounded-xl bg-card dark:bg-dark-card border-2 shadow-md hover:shadow-lg transition-shadow"
      style={{ borderColor: data.borderColor || '#D4A574' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-cinnabar !w-3 !h-3" />
      <p className="font-bold text-ink dark:text-dark-text text-lg whitespace-nowrap">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-cinnabar !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

const generationColors = [
  '#8B2500', '#7A2E00', '#6B3500', '#5C3C00', '#4D4300',
  '#8B3520', '#7A3A2A', '#6B4034', '#5C463E', '#4D4C48',
  '#8B4535', '#7A4A3D', '#6B5045', '#5C564D', '#4D5C55',
  '#8B554A', '#7A5A50', '#6B6055', '#5C665A', '#4D6C5F',
  '#8B655F',
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
      edges.push({
        id: `${n.id}-${c.id}`,
        source: n.id,
        target: c.id,
        type: 'default',
        style: { stroke: '#D4A574', strokeWidth: 2 },
        animated: false,
      });
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

  if (!roots.length) return <div className="w-full bg-card dark:bg-dark-card shadow-sm p-6 text-center text-muted dark:text-dark-muted text-sm">暂无数据</div>;

  return (
    <div className="w-full">
      <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border dark:border-dark-border">
          <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-muted dark:text-dark-muted">双指缩放 · 拖拽移动</p>
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
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E8D5B7" />
            <Controls showInteractive={false} position="bottom-right" className="!bg-card dark:!bg-dark-card !rounded-lg !shadow-md !border !border-border" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
