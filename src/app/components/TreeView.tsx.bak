"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node, Edge, Background, Controls,
  Position, Handle, BackgroundVariant,
  useNodesState, useEdgesState,
} from 'reactflow';
import { ReactFlowProvider, useReactFlow } from 'reactflow';
import { Squares2X2Icon, ChevronRightIcon } from '@heroicons/react/24/outline';
import 'reactflow/dist/style.css';
import { FamilyData } from '@/types/family';

interface TreeViewProps { data: FamilyData }

/* ---------- 世代颜色 ---------- */
const generationColors = [
  '#8B2500', '#7A2E00', '#6B3500', '#5C3C00', '#4D4300',
  '#8B3520', '#7A3A2A', '#6B4034', '#5C463E', '#4D4C48',
  '#8B4535', '#7A4A3D', '#6B5045', '#5C564D', '#4D5C55',
  '#8B554A', '#7A5A50', '#6B6055', '#5C665A', '#4D6C5F',
  '#8B655F',
];

const H_GAP = 180;
const V_GAP = 100;
const DEFAULT_EXPAND_DEPTH = 2; // 展开到第3代（0/1/2）

/* ---------- 数据结构 ---------- */
interface TreeNode {
  id: string;
  name: string;
  depth: number;
  borderColor: string;
  childCount: number;
  childIds: string[];
}

/* ---------- 从 FamilyData 构建树 ---------- */
function buildTree(data: FamilyData): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();

  // 先建所有节点
  data.generations.forEach((gen, gi) => {
    gen.people.forEach(p => {
      if (!p.id) return;
      const borderColor = generationColors[gi % generationColors.length];
      map.set(p.id, {
        id: p.id,
        name: p.name,
        depth: gi,
        borderColor,
        childCount: 0,
        childIds: [],
      });
    });
  });

  // 建立父子关系
  data.generations.forEach(gen => {
    gen.people.forEach(p => {
      if (!p.id || !p.fatherId) return;
      const parent = map.get(p.fatherId);
      if (parent) {
        parent.childCount++;
        parent.childIds.push(p.id);
      }
    });
  });

  return map;
}

/* ---------- 子树宽度计算 ---------- */
function getSubtreeWidth(nodeMap: Map<string, TreeNode>, id: string, collapsedIds: Set<string>): number {
  const node = nodeMap.get(id);
  if (!node || node.childCount === 0 || collapsedIds.has(id)) return 1;
  let total = 0;
  for (const cid of node.childIds) {
    total += getSubtreeWidth(nodeMap, cid, collapsedIds);
  }
  return Math.max(total, 1);
}

/* ---------- 布局引擎 ---------- */
interface LayoutResult { nodes: Node[]; edges: Edge[] }

function layoutVisible(nodeMap: Map<string, TreeNode>, rootIds: string[], collapsedIds: Set<string>): LayoutResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const NODE_HW = 70; // 节点半宽

  // 布局实现
  function layNode(id: string, centerX: number, y: number) {
    const node = nodeMap.get(id);
    if (!node) return;

    const children = collapsedIds.has(id) ? [] : node.childIds;

    nodes.push({
      id,
      type: 'personNode',
      position: { x: centerX - NODE_HW, y },
      data: {
        label: node.name,
        borderColor: node.borderColor,
        childCount: node.childCount,
        collapsed: collapsedIds.has(id),
        nodeId: id,
      },
    });

    if (children.length === 0) return;

    const ws = children.map(cid => getSubtreeWidth(nodeMap, cid, collapsedIds));
    const totalW = ws.reduce((a, b) => a + b, 0) * H_GAP;
    let startX = centerX - totalW / 2;

    for (let i = 0; i < children.length; i++) {
      const childCenter = startX + ws[i] * H_GAP / 2;
      layNode(children[i], childCenter, y + V_GAP);

      edges.push({
        id: `${id}-${children[i]}`,
        source: id,
        target: children[i],
        type: 'default',
        style: { stroke: '#D4A574', strokeWidth: 2 },
      });

      startX += ws[i] * H_GAP;
    }
  }

  // 多个根节点：从正坐标开始布局，居中由 fitView 处理
  const rootWidths = rootIds.map(rid => getSubtreeWidth(nodeMap, rid, collapsedIds));
  const totalRootW = rootWidths.reduce((a, b) => a + b, 0) * H_GAP;
  let startX = 0;

  for (let i = 0; i < rootIds.length; i++) {
    const center = startX + rootWidths[i] * H_GAP / 2;
    layNode(rootIds[i], center, 0);
    startX += rootWidths[i] * H_GAP;
  }

  return { nodes, edges };
}

/* ---------- 自定义节点组件 ---------- */
function PersonNode({ data }: any) {
  const { label, borderColor, childCount, collapsed, nodeId, onToggle } = data;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggle) onToggle(nodeId);
  }, [nodeId, onToggle]);

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-cinnabar !w-3 !h-3" />
      <div
        className="px-4 py-2.5 rounded-xl bg-card dark:bg-dark-card border-2 shadow-md hover:shadow-lg transition-shadow min-w-[100px]"
        style={{ borderColor }}
      >
        <p className="font-bold font-serif text-ink dark:text-dark-text text-base whitespace-nowrap text-center">
          {label}
        </p>
      </div>
      {childCount > 0 && (
        <button
          onClick={handleToggle}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm transition-all
            bg-cinnabar/10 dark:bg-cinnabar/20 border-cinnabar/40 dark:border-cinnabar/60 text-cinnabar dark:text-dark-cinnabar
            hover:bg-cinnabar/20 dark:hover:bg-cinnabar/30 active:scale-95 whitespace-nowrap cursor-pointer"
        >
          {collapsed ? (
            <span className="flex items-center gap-0.5">
              <ChevronRightIcon className="h-3 w-3" />
              {childCount}人
            </span>
          ) : (
            <span className="flex items-center gap-0.5">
              收起
            </span>
          )}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-cinnabar !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = { personNode: PersonNode };

/* ---------- 内部组件 ---------- */
function TreeViewInner({ data }: TreeViewProps) {
  const { fitView } = useReactFlow();
  const treeMap = useMemo(() => buildTree(data), [data]);
  const rootIds = useMemo(() => (data.generations[0]?.people || []).map(p => p.id!).filter(Boolean), [data]);

  // collapsedIds: 当前折叠的节点集合（默认第3代及以后折叠）
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    treeMap.forEach((node) => {
      if (node.depth >= DEFAULT_EXPAND_DEPTH) s.add(node.id);
    });
    return s;
  });

  // 折叠/展开回调，通过 node data 传递
  const handleToggle = useCallback((nodeId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        // 展开：移除自身的折叠状态
        next.delete(nodeId);
      } else {
        // 折叠：把自身和所有后代加入折叠
        next.add(nodeId);
        const node = treeMap.get(nodeId);
        if (node) {
          const stack = [...node.childIds];
          while (stack.length) {
            const cid = stack.pop()!;
            next.add(cid);
            const child = treeMap.get(cid);
            if (child) stack.push(...child.childIds);
          }
        }
      }
      return next;
    });
  }, [treeMap]);

  const { nodes, edges } = useMemo(() => {
    return layoutVisible(treeMap, rootIds, collapsedIds);
  }, [treeMap, rootIds, collapsedIds]);

  // 初始居中 + 每次布局变化后重新 fitView
  const prevCollapsedRef = useRef<string>('');
  useEffect(() => {
    const key = [...collapsedIds].sort().join(',');
    if (key !== prevCollapsedRef.current) {
      prevCollapsedRef.current = key;
      // 延迟一帧让 ReactFlow 先渲染新节点
      requestAnimationFrame(() => {
        fitView({ padding: 0.1, duration: 300 });
      });
    }
  }, [collapsedIds, fitView]);

  // 注入 onToggle 到每个节点的 data
  const nodesWithToggle = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: { ...n.data, onToggle: handleToggle },
    }));
  }, [nodes, handleToggle]);

  if (!rootIds.length) {
    return <div className="w-full bg-card dark:bg-dark-card shadow-sm p-6 text-center text-muted dark:text-dark-muted text-sm">暂无数据</div>;
  }

  return (
    <div className="w-full">
      <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border dark:border-dark-border">
          <Squares2X2Icon className="h-5 w-5 text-cinnabar" />
          <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-muted dark:text-dark-muted">点击展开/折叠 · 拖拽移动</p>
        </div>
        <div className="w-full h-[70vh] sm:h-[80vh]">
          <ReactFlow
            nodes={nodesWithToggle}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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

export default function TreeView(props: TreeViewProps) {
  return (
    <ReactFlowProvider>
      <TreeViewInner {...props} />
    </ReactFlowProvider>
  );
}
