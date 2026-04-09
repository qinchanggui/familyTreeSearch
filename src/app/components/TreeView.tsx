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

// 自定义节点 — 手机端紧凑样式
function PersonNode({ data }: NodeProps) {
  return (
    <div
      className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-white border-2 shadow-sm min-w-[60px] max-w-[120px] sm:max-w-[160px] hover:shadow-md transition-shadow"
      style={{ borderColor: data.borderColor || '#93c5fd' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-1.5 !h-1.5 sm:!w-2 sm:!h-2" />
      <div className="text-center">
        <p className="font-bold text-gray-800 text-xs sm:text-sm leading-tight">{data.label}</p>
        {data.info && (
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 leading-snug line-clamp-2">{data.info}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-1.5 !h-1.5 sm:!w-2 sm:!h-2" />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

// 世代对应颜色
const generationColors = [
  '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
  '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
  '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa',
];

// 递归计算子树宽度
function getSubtreeWidth(person: Person): number {
  if (!person.children || person.children.length === 0) return 1;
  return person.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0);
}

// 布局算法
const NODE_GAP_V = 110;
const NODE_GAP_V_MOBILE = 90;
const NODE_WIDTH = 140;

function layoutTree(person: Person, x: number, y: number, depth: number, isMobile: boolean): any {
  const children = person.children || [];
  const gap = isMobile ? NODE_GAP_V_MOBILE : NODE_GAP_V;
  const borderColor = generationColors[depth % generationColors.length];

  if (children.length === 0) {
    return {
      id: person.id || '',
      name: person.name,
      info: isMobile ? '' : (person.info || ''),  // 手机端不显示info，节省空间
      x, y,
      borderColor,
      children: [],
    };
  }

  const childWidths = children.map(c => getSubtreeWidth(c));
  const totalWidth = childWidths.reduce((a, b) => a + b, 0);
  const width = isMobile ? NODE_WIDTH * 0.7 : NODE_WIDTH;

  const layoutChildren: any[] = [];
  let currentX = x - (totalWidth * width) / 2;

  for (let i = 0; i < children.length; i++) {
    const childX = currentX + (childWidths[i] * width) / 2;
    layoutChildren.push(layoutTree(children[i], childX, y + gap, depth + 1, isMobile));
    currentX += childWidths[i] * width;
  }

  const firstChild = layoutChildren[0];
  const lastChild = layoutChildren[layoutChildren.length - 1];
  const parentX = (firstChild.x + lastChild.x) / 2;

  return {
    id: person.id || '',
    name: person.name,
    info: isMobile ? '' : (person.info || ''),
    x: parentX,
    y,
    borderColor,
    children: layoutChildren,
  };
}

function layoutToElements(layout: any): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(ln: any) {
    const w = typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 70;
    nodes.push({
      id: ln.id,
      type: 'person',
      position: { x: ln.x - w, y: ln.y },
      data: { label: ln.name, info: ln.info, borderColor: ln.borderColor },
    });

    for (const child of ln.children) {
      edges.push({
        id: `${ln.id}-${child.id}`,
        source: ln.id,
        target: child.id,
        type: 'smoothstep',
        style: { stroke: '#93c5fd', strokeWidth: 1.5 },
      });
      traverse(child);
    }
  }

  traverse(layout);
  return { nodes, edges };
}

export default function TreeView({ data }: TreeViewProps) {
  const rootPeople = data.generations[0]?.people || [];

  // 检测是否移动端
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const { initialNodes, initialEdges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    for (const person of rootPeople) {
      const layout = layoutTree(person, 0, 0, 0, isMobile);
      const { nodes, edges } = layoutToElements(layout);

      if (allNodes.length > 0) {
        const w = isMobile ? NODE_WIDTH * 0.7 : NODE_WIDTH;
        const maxX = Math.max(...allNodes.map(n => n.position.x + w));
        const minX = Math.min(...nodes.map(n => n.position.x));
        const shift = maxX + w * 0.5 - minX;
        nodes.forEach(n => (n.position.x += shift));
      }

      allNodes.push(...nodes);
      allEdges.push(...edges);
    }

    return { initialNodes: allNodes, initialEdges: allEdges };
  }, [rootPeople, isMobile]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  const getFitViewOptions = useCallback(() => {
    return { padding: 0.15, duration: 200 };
  }, []);

  if (rootPeople.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 text-center text-gray-400 py-8">
          <p className="text-sm">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-xl font-bold text-gray-800">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-gray-400">
            {isMobile ? '双指缩放 · 拖拽移动' : '滚轮缩放 · 拖拽移动'}
          </p>
        </div>
        <div className="w-full h-[65vh] sm:h-[75vh]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={getFitViewOptions()}
            minZoom={0.03}
            maxZoom={2}
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#f3f4f6" />
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
