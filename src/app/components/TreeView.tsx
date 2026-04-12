"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Squares2X2Icon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FamilyData } from '@/types/family';

interface TreeViewProps { data: FamilyData }

const generationColors = [
  '#8B2500', '#7A2E00', '#6B3500', '#5C3C00', '#4D4300',
  '#8B3520', '#7A3A2A', '#6B4034', '#5C463E', '#4D4C48',
  '#8B4535', '#7A4A3D', '#6B5045', '#5C564D', '#4D5C55',
  '#8B554A', '#7A5A50', '#6B6055', '#5C665A', '#4D6C5F',
  '#8B655F',
];

const DEFAULT_EXPAND_DEPTH = 1;
const CARD_W = 80;
const CARD_H = 36;
const H_GAP = 16;
const V_GAP = 60;
const PADDING = 40;

interface TreeNode {
  id: string; name: string; info?: string; depth: number;
  borderColor: string; childCount: number; childIds: string[];
}

function buildTree(data: FamilyData): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();
  data.generations.forEach((gen, gi) => {
    gen.people.forEach(p => {
      if (!p.id) return;
      map.set(p.id, {
        id: p.id, name: p.name, info: p.info || undefined, depth: gi,
        borderColor: generationColors[gi % generationColors.length],
        childCount: 0, childIds: [],
      });
    });
  });
  data.generations.forEach(gen => {
    gen.people.forEach(p => {
      if (!p.id || !p.fatherId) return;
      const parent = map.get(p.fatherId);
      if (parent) { parent.childCount++; parent.childIds.push(p.id); }
    });
  });
  return map;
}

interface PlacedNode {
  id: string; name: string; info?: string;
  x: number; y: number; borderColor: string;
  childCount: number; isCollapsed: boolean; depth: number;
}
interface Edge { x1: number; y1: number; x2: number; y2: number; }

function subtreeW(nm: Map<string, TreeNode>, id: string, col: Set<string>): number {
  const n = nm.get(id);
  if (!n || n.childCount === 0 || col.has(id)) return CARD_W;
  const t = n.childIds.reduce((s, c) => s + subtreeW(nm, c, col) + H_GAP, -H_GAP);
  return Math.max(t, CARD_W);
}

function layout(nm: Map<string, TreeNode>, roots: string[], col: Set<string>) {
  const nodes: PlacedNode[] = [];
  const edges: Edge[] = [];

  function lay(id: string, cx: number, y: number) {
    const n = nm.get(id);
    if (!n) return;
    const isCol = col.has(id);
    nodes.push({
      id, name: n.name, info: n.info,
      x: cx - CARD_W / 2, y,
      borderColor: n.borderColor,
      childCount: n.childCount, isCollapsed: isCol, depth: n.depth,
    });
    if (isCol || n.childCount === 0) return;
    const cws = n.childIds.map(c => subtreeW(nm, c, col));
    const tw = cws.reduce((a, b) => a + b, 0) + H_GAP * (cws.length - 1);
    let sx = cx - tw / 2;
    const py = y + CARD_H;
    const cy = y + CARD_H + V_GAP;
    for (let i = 0; i < n.childIds.length; i++) {
      const ccx = sx + cws[i] / 2;
      edges.push({ x1: cx, y1: py, x2: ccx, y2: cy });
      lay(n.childIds[i], ccx, cy);
      sx += cws[i] + H_GAP;
    }
  }

  const rws = roots.map(r => subtreeW(nm, r, col));
  const tw = rws.reduce((a, b) => a + b, 0) + H_GAP * (Math.max(roots.length - 1, 0));
  let sx = PADDING + tw / 2;
  for (let i = 0; i < roots.length; i++) {
    lay(roots[i], sx, PADDING);
    sx += rws[i] + H_GAP;
  }

  const totalW = (nodes.length ? Math.max(...nodes.map(n => n.x + CARD_W)) : 0) + PADDING;
  const totalH = (nodes.length ? Math.max(...nodes.map(n => n.y + CARD_H)) : 0) + PADDING;
  return { nodes, edges, totalW, totalH };
}

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

  const { nodes, edges, totalW, totalH } = useMemo(
    () => layout(treeMap, rootIds, collapsedIds),
    [treeMap, rootIds, collapsedIds]
  );

  // 视图状态（用 viewState 避免与 CSS Transform 类型名冲突）
  const containerRef = useRef<HTMLDivElement>(null);
  const [vs, setVs] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(false);
  const dragRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0, os: 0 });

  // fitView
  const fitView = useCallback((anim = false) => {
    const el = containerRef.current;
    if (!el || totalW === 0 || totalH === 0) return;
    const pw = el.clientWidth;
    const ph = el.clientHeight;
    const s = Math.min(pw / totalW, ph / totalH, 1.5) * 0.85;
    setVs({ x: (pw - totalW * s) / 2, y: (ph - totalH * s) / 2, scale: s });
  }, [totalW, totalH]);

  // 初始化 + 尺寸变化时自动 fitView
  useEffect(() => {
    if (totalW === 0 || totalH === 0) return;
    const t = setTimeout(() => fitView(true), 150);
    return () => clearTimeout(t);
  }, [totalW, totalH, fitView]);

  // 拖拽
  const onDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: vs.x, oy: vs.y, os: vs.scale };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [vs.x, vs.y, vs.scale]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setVs(p => ({
      x: dragRef.current.ox + (e.clientX - dragRef.current.mx),
      y: dragRef.current.oy + (e.clientY - dragRef.current.my),
      scale: p.scale,
    }));
  }, []);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  // 滚轮缩放
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const f = e.deltaY > 0 ? 0.9 : 1.1;
    const ns = Math.min(Math.max(vs.scale * f, 0.02), 4);
    setVs({
      x: mx - (mx - vs.x) * (ns / vs.scale),
      y: my - (my - vs.y) * (ns / vs.scale),
      scale: ns,
    });
  }, [vs]);

  const zoomAt = useCallback((factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const ns = Math.min(Math.max(vs.scale * factor, 0.02), 4);
    setVs({
      x: cx - (cx - vs.x) * (ns / vs.scale),
      y: cy - (cy - vs.y) * (ns / vs.scale),
      scale: ns,
    });
  }, [vs]);

  const tfm = `translate(${vs.x}px, ${vs.y}px) scale(${vs.scale})`;

  if (!rootIds.length) {
    return (
      <div className="w-full bg-card dark:bg-dark-card shadow-sm p-6 text-center text-muted dark:text-dark-muted text-sm">暂无数据</div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border dark:border-dark-border">
          <Squares2X2Icon className="h-5 w-5 text-cinnabar" />
          <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">家族树状图</h2>
          <p className="text-[10px] sm:text-xs text-muted dark:text-dark-muted hidden sm:block">点击卡片展开/折叠 · 滚轮缩放 · 拖拽移动</p>
        </div>

        <div
          ref={containerRef}
          className="w-full h-[70vh] sm:h-[80vh] relative overflow-hidden bg-paper dark:bg-dark-bg"
          style={{ touchAction: 'none', cursor: dragging.current ? 'grabbing' : 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #8B2500 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          <div className="absolute top-0 left-0" style={{ width: totalW, height: totalH, transform: tfm, transformOrigin: '0 0' }}>
            <svg width={totalW} height={totalH} className="absolute top-0 left-0 pointer-events-none" style={{ overflow: 'visible' }}>
              {edges.map((e, i) => (
                <path key={i}
                  d={`M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + V_GAP * 0.45}, ${e.x2} ${e.y2 - V_GAP * 0.45}, ${e.x2} ${e.y2}`}
                  fill="none" stroke="#C4956A" strokeWidth="1.5" opacity="0.5"
                />
              ))}
            </svg>

            {nodes.map(node => (
              <div key={node.id} className="absolute flex flex-col items-center" style={{ left: node.x, top: node.y, width: CARD_W }}>
                <div
                  className="w-full px-2 py-1.5 rounded-lg bg-card dark:bg-dark-card border shadow-sm hover:shadow-md transition-all cursor-pointer select-none hover:scale-105 active:scale-95"
                  style={{ borderColor: node.borderColor }}
                  onClick={() => toggleNode(node.id)}
                  title={node.info || node.name}
                >
                  <p className="font-bold font-serif text-ink dark:text-dark-text text-xs leading-tight whitespace-nowrap text-center truncate">{node.name}</p>
                </div>
                {node.childCount > 0 && (
                  <div
                    className={`mt-0.5 px-1.5 py-px rounded-full text-[9px] font-medium border cursor-pointer select-none whitespace-nowrap transition-colors
                      ${node.isCollapsed
                        ? 'bg-cinnabar/10 dark:bg-cinnabar/20 border-cinnabar/40 dark:border-cinnabar/60 text-cinnabar dark:text-dark-cinnabar hover:bg-cinnabar/20'
                        : 'bg-forest/10 dark:bg-forest/20 border-forest/40 dark:border-forest/60 text-forest dark:text-dark-forest hover:bg-forest/20'
                      }`}
                    onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                  >
                    {node.isCollapsed ? (
                      <span className="flex items-center gap-0.5"><ChevronRightIcon className="h-2.5 w-2.5" />{node.childCount}</span>
                    ) : (
                      <span className="flex items-center gap-0.5"><ChevronDownIcon className="h-2.5 w-2.5" />收起</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
            <button onClick={() => zoomAt(1.3)} className="w-8 h-8 flex items-center justify-center bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors text-base font-bold" title="放大">+</button>
            <button onClick={() => zoomAt(1/1.3)} className="w-8 h-8 flex items-center justify-center bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors text-base font-bold" title="缩小">−</button>
            <button onClick={() => fitView(true)} className="w-8 h-8 flex items-center justify-center bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors" title="适应视图">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            </button>
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button onClick={() => setCollapsedIds(new Set())} className="px-2.5 py-1 text-[11px] bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors">展开全部</button>
            <button onClick={() => { const s = new Set<string>(); treeMap.forEach((n) => { if (n.depth >= 1) s.add(n.id); }); setCollapsedIds(s); }} className="px-2.5 py-1 text-[11px] bg-card/90 dark:bg-dark-card/90 backdrop-blur rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors">折叠全部</button>
          </div>

          <div className="absolute bottom-3 left-3 text-[10px] text-muted dark:text-dark-muted z-10">
            共 {nodes.length} 人 · {new Set(nodes.map(n => n.depth)).size} 世代
          </div>
        </div>
      </div>
    </div>
  );
}
