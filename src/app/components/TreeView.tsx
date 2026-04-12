"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Squares2X2Icon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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

const DEFAULT_EXPAND_DEPTH = 2;
const CARD_W = 72;  // 卡片宽度 px
const CARD_H = 32;  // 卡片高度 px
const H_GAP = 12;   // 兄弟节点间距
const V_GAP = 56;   // 父子层间距

/* ---------- 数据结构 ---------- */
interface TreeNode {
  id: string;
  name: string;
  info?: string;
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
        info: p.info || undefined,
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

/* ---------- 子树宽度（像素） ---------- */
function subtreeW(nodeMap: Map<string, TreeNode>, id: string, collapsed: Set<string>): number {
  const node = nodeMap.get(id);
  if (!node || node.childCount === 0 || collapsed.has(id)) return CARD_W;
  const total = node.childIds.reduce((sum, cid) => sum + subtreeW(nodeMap, cid, collapsed) + H_GAP, -H_GAP);
  return Math.max(total, CARD_W);
}

/* ---------- 布局 + SVG ---------- */
interface PlacedNode {
  id: string;
  name: string;
  info?: string;
  x: number;
  y: number;
  borderColor: string;
  childCount: number;
  isCollapsed: boolean;
  depth: number;
}

function layoutAll(nodeMap: Map<string, TreeNode>, rootIds: string[], collapsed: Set<string>) {
  const placed: PlacedNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  function lay(id: string, cx: number, y: number) {
    const node = nodeMap.get(id);
    if (!node) return;
    const isCol = collapsed.has(id);
    placed.push({
      id, name: node.name, info: node.info,
      x: cx - CARD_W / 2, y,
      borderColor: node.borderColor,
      childCount: node.childCount,
      isCollapsed: isCol,
      depth: node.depth,
    });
    if (isCol || node.childCount === 0) return;
    const childWs = node.childIds.map(cid => subtreeW(nodeMap, cid, collapsed));
    const totalW = childWs.reduce((a, b) => a + b, 0) + H_GAP * (childWs.length - 1);
    let sx = cx - totalW / 2;
    const parentBottom = y + CARD_H;
    const childTop = y + CARD_H + V_GAP;
    for (let i = 0; i < node.childIds.length; i++) {
      const ccx = sx + childWs[i] / 2;
      edges.push({ x1: cx, y1: parentBottom, x2: ccx, y2: childTop });
      lay(node.childIds[i], ccx, childTop);
      sx += childWs[i] + H_GAP;
    }
  }

  // 多个根节点水平排列
  const rootWs = rootIds.map(rid => subtreeW(nodeMap, rid, collapsed));
  const totalW = rootWs.reduce((a, b) => a + b, 0) + H_GAP * (rootWs.length - 1);
  let sx = -totalW / 2;
  for (let i = 0; i < rootIds.length; i++) {
    const cx = sx + rootWs[i] / 2;
    lay(rootIds[i], cx, 0);
    sx += rootWs[i] + H_GAP;
  }

  return { placed, edges };
}

/* ---------- 主组件 ---------- */
export default function TreeView({ data }: TreeViewProps) {
  const treeMap = useMemo(() => buildTree(data), [data]);
  const rootIds = useMemo(
    () => (data.generations[0]?.people || []).map(p => p.id!).filter(Boolean),
    [data]
  );

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

  // 布局计算
  const { placed, edges } = useMemo(
    () => layoutAll(treeMap, rootIds, collapsedIds),
    [treeMap, rootIds, collapsedIds]
  );

  // 计算 SVG 尺寸
  const svgW = useMemo(() => {
    if (!placed.length) return 400;
    const maxX = Math.max(...placed.map(n => n.x + CARD_W));
    return Math.max(maxX + 40, 400);
  }, [placed]);

  const svgH = useMemo(() => {
    if (!placed.length) return 300;
    const maxY = Math.max(...placed.map(n => n.y + CARD_H));
    return maxY + 60;
  }, [placed]);

  // 画布偏移（让内容居中）
  const offsetX = svgW > 0 ? svgW / 2 : 0;

  // Pan/zoom
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<any>(null);

  const initPanZoom = useCallback(() => {
    if (!innerRef.current || !wrapperRef.current) return;
    import('@panzoom/panzoom').then(({ default: Panzoom }) => {
      if (!innerRef.current || !wrapperRef.current) return;
      const currentW = innerRef.current.scrollWidth;
      const pz = Panzoom(innerRef.current, {
        maxScale: 4,
        minScale: 0.02,
        startScale: 0.8,
        startX: 0,
        startY: 0,
      });
      wrapperRef.current.addEventListener('wheel', pz.zoomWithWheel, { passive: false });
      panzoomRef.current = pz;

      // 初始居中
      const parent = wrapperRef.current;
      const scale = 0.8;
      pz.zoom(scale);
      pz.pan(
        (parent.clientWidth / 2) - (currentW * scale / 2),
        30
      );
    });
  }, []);

  useEffect(() => {
    initPanZoom();
    return () => {
      if (panzoomRef.current) {
        panzoomRef.current.destroy();
        panzoomRef.current = null;
      }
    };
  }, [initPanZoom]);

  const handleZoomIn = useCallback(() => {
    panzoomRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    panzoomRef.current?.zoomOut();
  }, []);

  const handleFitView = useCallback(() => {
    if (!wrapperRef.current || !panzoomRef.current) return;
    const parent = wrapperRef.current;
    const scaleX = parent.clientWidth / (svgW + 40);
    const scaleY = parent.clientHeight / (svgH + 40);
    const scale = Math.min(scaleX, scaleY, 1.5);
    panzoomRef.current.zoom(scale);
    panzoomRef.current.pan(
      (parent.clientWidth - svgW * scale) / 2,
      (parent.clientHeight - svgH * scale) / 2
    );
  }, [svgW, svgH]);

  if (!rootIds.length) {
    return (
      <div className="w-full bg-card dark:bg-dark-card shadow-sm p-6 text-center text-muted dark:text-dark-muted text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border dark:border-dark-border">
          <Squares2X2Icon className="h-5 w-5 text-cinnabar" />
          <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-muted dark:text-dark-muted hidden sm:block">
            点击卡片展开/折叠 · 滚轮缩放 · 拖拽移动
          </p>
        </div>

        {/* 画布区域 */}
        <div
          ref={wrapperRef}
          className="w-full h-[70vh] sm:h-[80vh] relative overflow-hidden bg-paper dark:bg-dark-bg cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #8B2500 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          {/* 可平移缩放的内容 */}
          <div ref={innerRef} className="origin-top-left">
            <svg
              width={svgW}
              height={svgH}
              className="absolute top-0 left-0 pointer-events-none"
            >
              <g>
                {edges.map((e, i) => (
                  <path
                    key={i}
                    d={`M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + V_GAP * 0.4}, ${e.x2} ${e.y2 - V_GAP * 0.4}, ${e.x2} ${e.y2}`}
                    fill="none"
                    stroke="#D4A574"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                ))}
              </g>
            </svg>

            {/* 节点卡片 */}
            {placed.map(node => (
              <div
                key={node.id}
                className="absolute flex flex-col items-center"
                style={{ left: node.x, top: node.y, width: CARD_W }}
              >
                {/* 卡片 */}
                <div
                  className="w-full px-1 py-1.5 rounded-lg bg-card dark:bg-dark-card border shadow-sm hover:shadow-md transition-all cursor-pointer select-none hover:scale-105 active:scale-95 group"
                  style={{ borderColor: node.borderColor }}
                  onClick={() => toggleNode(node.id)}
                  title={node.info || node.name}
                >
                  <p className="font-bold font-serif text-ink dark:text-dark-text text-[11px] leading-tight whitespace-nowrap text-center truncate">
                    {node.name}
                  </p>
                </div>

                {/* 展开/折叠指示 */}
                {node.childCount > 0 && (
                  <div
                    className={`mt-0.5 px-1.5 py-px rounded-full text-[9px] font-medium border cursor-pointer select-none whitespace-nowrap
                      ${node.isCollapsed
                        ? 'bg-cinnabar/10 dark:bg-cinnabar/20 border-cinnabar/40 dark:border-cinnabar/60 text-cinnabar dark:text-dark-cinnabar'
                        : 'bg-forest/10 dark:bg-forest/20 border-forest/40 dark:border-forest/60 text-forest dark:text-dark-forest'
                      }`}
                    onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                  >
                    {node.isCollapsed ? (
                      <span className="flex items-center gap-0.5">
                        <ChevronRightIcon className="h-2.5 w-2.5" />
                        {node.childCount}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <ChevronDownIcon className="h-2.5 w-2.5" />
                        收起
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 控制按钮 */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
            <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors text-base font-bold" title="放大">+</button>
            <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors text-base font-bold" title="缩小">−</button>
            <button onClick={handleFitView} className="w-8 h-8 flex items-center justify-center bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors" title="适应视图">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            </button>
          </div>

          {/* 展开全部 / 折叠全部 */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button onClick={() => setCollapsedIds(new Set())} className="px-2.5 py-1 text-[11px] bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors">展开全部</button>
            <button onClick={() => { const s = new Set<string>(); treeMap.forEach((n) => { if (n.depth >= 1) s.add(n.id); }); setCollapsedIds(s); }} className="px-2.5 py-1 text-[11px] bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors">折叠全部</button>
          </div>

          {/* 世代统计 */}
          <div className="absolute bottom-3 left-3 text-[10px] text-muted dark:text-dark-muted z-10">
            共 {placed.length} 人 · {new Set(placed.map(n => n.depth)).size} 世代
          </div>
        </div>
      </div>
    </div>
  );
}
