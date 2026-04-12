"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import ReactFlow, {
  Node, Edge, Background, Controls,
  Position, Handle, BackgroundVariant,
} from 'reactflow';
import { ReactFlowProvider, useReactFlow, useNodesInitialized } from 'reactflow';
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
const DEFAULT_EXPAND_DEPTH = 2;

/* ---------- 全局 toggle 回调（解决 nodeTypes 闭包问题） ---------- */
let globalToggleFn: ((nodeId: string) => void) | null = null;

// 使用 getter 函数，避免闭包捕获 null 值
function getToggleFn() { return globalToggleFn; }

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
  data.generations.forEach((gen, gi) => {
    gen.people.forEach(p => {
      if (!p.id) return;
      map.set(p.id, {
        id: p.id,
        name: p.name,
        depth: gi,
        borderColor: generationColors[gi % generationColors.length],
        childCount: 0,
        childIds: [],
      });
    });
  });
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
function getSubtreeWidth(nodeMap: Map<string, TreeNode>, id: string, collapsedSet: Set<string>): number {
  const node = nodeMap.get(id);
  if (!node || node.childCount === 0 || collapsedSet.has(id)) return 1;
  let total = 0;
  for (const cid of node.childIds) {
    total += getSubtreeWidth(nodeMap, cid, collapsedSet);
  }
  return Math.max(total, 1);
}

/* ---------- 布局引擎 ---------- */
interface LayoutResult { nodes: Node[]; edges: Edge[] }

function layoutTree(nodeMap: Map<string, TreeNode>, rootIds: string[], collapsedSet: Set<string>): LayoutResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const NODE_HW = 70;

  function lay(id: string, cx: number, y: number) {
    const node = nodeMap.get(id);
    if (!node) return;
    const children = collapsedSet.has(id) ? [] : node.childIds;

    nodes.push({
      id,
      type: 'personNode',
      position: { x: cx - NODE_HW, y },
      data: {
        label: node.name,
        borderColor: node.borderColor,
        childCount: node.childCount,
        collapsed: collapsedSet.has(id),
        nodeId: id,
      },
    });

    if (children.length === 0) return;
    const ws = children.map(cid => getSubtreeWidth(nodeMap, cid, collapsedSet));
    const totalW = ws.reduce((a, b) => a + b, 0) * H_GAP;
    let sx = cx - totalW / 2;
    for (let i = 0; i < children.length; i++) {
      const ccx = sx + ws[i] * H_GAP / 2;
      lay(children[i], ccx, y + V_GAP);
      edges.push({ id: `${id}-${children[i]}`, source: id, target: children[i], style: { stroke: '#D4A574', strokeWidth: 2 } });
      sx += ws[i] * H_GAP;
    }
  }

  const rws = rootIds.map(rid => getSubtreeWidth(nodeMap, rid, collapsedSet));
  const totalW = rws.reduce((a, b) => a + b, 0) * H_GAP;
  let sx = -totalW / 2;
  for (let i = 0; i < rootIds.length; i++) {
    lay(rootIds[i], sx + rws[i] * H_GAP / 2, 0);
    sx += rws[i] * H_GAP;
  }

  return { nodes, edges };
}

/* ---------- 自定义节点组件 ---------- */
function PersonNode({ data }: any) {
  const { label, borderColor, childCount, collapsed, nodeId } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    // Debug: confirm useEffect runs
    (window as any).__treeDebug = 'useEffect ran';
    const onDown = (e: PointerEvent) => {
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!mouseDownPos.current) return;
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      mouseDownPos.current = null;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
      const fn = getToggleFn();
      (window as any).__treeDebug = 'pointerup fired, fn=' + !!fn;
      if (fn) flushSync(() => fn(nodeId));
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
    };
  }, [nodeId]);

  return (
    <div ref={nodeRef} className="nopan nodrag relative">
      <Handle type="target" position={Position.Top} className="!bg-cinnabar !w-3 !h-3" />
      <div
        className="px-4 py-2.5 rounded-xl bg-card dark:bg-dark-card border-2 shadow-md hover:shadow-lg transition-shadow min-w-[100px] cursor-pointer"
        style={{ borderColor }}
      >
        <p className="font-bold font-serif text-ink dark:text-dark-text text-base whitespace-nowrap text-center">
          {label}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cinnabar !w-3 !h-3 !bottom-[-18px]" />
      {childCount > 0 && (
        <span
          className={`absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm whitespace-nowrap pointer-events-none select-none
            ${collapsed
              ? 'bg-cinnabar/10 dark:bg-cinnabar/20 border-cinnabar/40 dark:border-cinnabar/60 text-cinnabar dark:text-dark-cinnabar'
              : 'bg-forest/10 dark:bg-forest/20 border-forest/40 dark:border-forest/60 text-forest dark:text-dark-forest'
            }`}
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
        </span>
      )}
    </div>
  );
}

const nodeTypes = { personNode: PersonNode };

/* ---------- 内部组件 ---------- */
function TreeViewInner({ data }: TreeViewProps) {
  const { fitView } = useReactFlow();
  const treeMap = useMemo(() => buildTree(data), [data]);
  const rootIds = useMemo(() => (data.generations[0]?.people || []).map(p => p.id!).filter(Boolean), [data]);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    treeMap.forEach((node) => {
      if (node.depth >= DEFAULT_EXPAND_DEPTH) s.add(node.id);
    });
    return s;
  });

  const toggleNode = useCallback((nodeId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
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

  const toggleRef = useRef<(nodeId: string) => void>(undefined);
  toggleRef.current = toggleNode;

  useEffect(() => {
    globalToggleFn = toggleRef.current!;
    return () => { globalToggleFn = null; };
  }, [toggleRef]);

  // 初始化时居中
  const nodesInitialized = useNodesInitialized();
  const fittedRef = useRef(false);
  useEffect(() => {
    if (nodesInitialized && !fittedRef.current) {
      fittedRef.current = true;
      const timer = setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 100);
      return () => clearTimeout(timer);
    }
  }, [nodesInitialized, fitView]);

  // 折叠变化后重新居中
  const prevKeyRef = useRef('');
  useEffect(() => {
    const key = [...collapsedIds].sort().join(',');
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key;
      const timer = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
      return () => clearTimeout(timer);
    }
  }, [collapsedIds, fitView]);

  const { nodes, edges } = useMemo(() => {
    return layoutTree(treeMap, rootIds, collapsedIds);
  }, [treeMap, rootIds, collapsedIds]);

  if (!rootIds.length) {
    return <div className="w-full bg-card dark:bg-dark-card shadow-sm p-6 text-center text-muted dark:text-dark-muted text-sm">暂无数据</div>;
  }

  return (
    <div className="w-full">
      <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border dark:border-dark-border">
          <Squares2X2Icon className="h-5 w-5 text-cinnabar" />
          <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-muted dark:text-dark-muted">点击人物卡片展开/折叠 · 拖拽空白区域移动</p>
        </div>
        <div className="w-full h-[70vh] sm:h-[80vh]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
            minZoom={0.05}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            panOnDrag={true}
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
