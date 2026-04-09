"use client";

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
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

// 自定义节点
function PersonNode({ data }: NodeProps) {
  return (
    <div className="px-3 py-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm min-w-[80px] max-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <div className="text-center">
        <p className="font-bold text-gray-800 text-sm leading-tight">{data.label}</p>
        {data.info && (
          <p className="text-gray-500 text-xs mt-1 leading-snug line-clamp-2">{data.info}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

// 递归计算子树宽度
function getSubtreeWidth(person: Person): number {
  if (!person.children || person.children.length === 0) return 1;
  return person.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0);
}

// 布局算法：自顶向下分配坐标
const NODE_VERTICAL_GAP = 120;
const NODE_MIN_WIDTH = 180;

interface LayoutNode {
  id: string;
  name: string;
  info: string;
  x: number;
  y: number;
  children: LayoutNode[];
}

function layoutTree(person: Person, x: number, y: number): LayoutNode {
  const children = person.children || [];

  if (children.length === 0) {
    return {
      id: person.id || '',
      name: person.name,
      info: person.info || '',
      x,
      y,
      children: [],
    };
  }

  // 计算每个子节点的子树宽度
  const childWidths = children.map(c => getSubtreeWidth(c));
  const totalWidth = childWidths.reduce((a, b) => a + b, 0);

  // 递归布局子节点
  const layoutChildren: LayoutNode[] = [];
  let currentX = x - (totalWidth * NODE_MIN_WIDTH) / 2;

  for (let i = 0; i < children.length; i++) {
    const childX = currentX + (childWidths[i] * NODE_MIN_WIDTH) / 2;
    layoutChildren.push(layoutTree(children[i], childX, y + NODE_VERTICAL_GAP));
    currentX += childWidths[i] * NODE_MIN_WIDTH;
  }

  // 父节点居中于子节点上方
  const firstChild = layoutChildren[0];
  const lastChild = layoutChildren[layoutChildren.length - 1];
  const parentX = (firstChild.x + lastChild.x) / 2;

  return {
    id: person.id || '',
    name: person.name,
    info: person.info || '',
    x: parentX,
    y,
    children: layoutChildren,
  };
}

// 将布局树转为 ReactFlow nodes 和 edges
function layoutToElements(layout: LayoutNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(ln: LayoutNode) {
    nodes.push({
      id: ln.id,
      type: 'person',
      position: { x: ln.x - NODE_MIN_WIDTH / 2, y: ln.y },
      data: { label: ln.name, info: ln.info },
    });

    for (const child of ln.children) {
      edges.push({
        id: `${ln.id}-${child.id}`,
        source: ln.id,
        target: child.id,
        type: 'smoothstep',
        style: { stroke: '#93c5fd', strokeWidth: 2 },
      });
      traverse(child);
    }
  }

  traverse(layout);
  return { nodes, edges };
}

export default function TreeView({ data }: TreeViewProps) {
  const rootPeople = data.generations[0]?.people || [];

  const { initialNodes, initialEdges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    let offsetX = 0;
    for (const person of rootPeople) {
      const layout = layoutTree(person, 0, 0);
      const { nodes, edges } = layoutToElements(layout);

      // 偏移每棵子树使其不相交
      if (allNodes.length > 0) {
        const maxX = Math.max(...allNodes.map(n => n.position.x + NODE_MIN_WIDTH));
        const minX = Math.min(...nodes.map(n => n.position.x));
        const shift = maxX + NODE_MIN_WIDTH - minX;
        nodes.forEach(n => (n.position.x += shift));
      }

      allNodes.push(...nodes);
      allEdges.push(...edges);
      offsetX += nodes.length * NODE_MIN_WIDTH;
    }

    return { initialNodes: allNodes, initialEdges: allEdges };
  }, [rootPeople]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  // 计算初始视口：适配屏幕
  const getFitViewOptions = useCallback(() => {
    return { padding: 0.2, duration: 300 };
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
    <div className="max-w-7xl mx-auto px-3 sm:px-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          家族树状图
        </h2>
        <p className="text-xs text-gray-400 px-4 sm:px-6 pb-2">
          可拖拽移动，滚轮缩放，双指捏合缩放
        </p>
        <div className="w-full h-[60vh] sm:h-[70vh]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={getFitViewOptions()}
            minZoom={0.05}
            maxZoom={2}
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
            <Controls
              showInteractive={false}
              position="bottom-right"
            />
            <MiniMap
              nodeColor="#93c5fd"
              maskColor="rgba(0,0,0,0.1)"
              position="bottom-left"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
