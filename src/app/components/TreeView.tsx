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

/* ---------- 递归渲染树节点 ---------- */
function TreeItem({
  nodeId,
  nodeMap,
  collapsedIds,
  onToggle,
}: {
  nodeId: string;
  nodeMap: Map<string, TreeNode>;
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const node = nodeMap.get(nodeId);
  if (!node) return null;

  const isCollapsed = collapsedIds.has(nodeId);
  const children = isCollapsed ? [] : node.childIds;

  return (
    <div className="flex flex-col items-center tree-node-item">
      {/* 人物卡片 */}
      <div
        className="px-3 py-2 rounded-xl bg-card dark:bg-dark-card border-2 shadow-md hover:shadow-lg transition-all duration-200 min-w-[80px] sm:min-w-[100px] cursor-pointer select-none hover:scale-105 active:scale-95"
        style={{ borderColor: node.borderColor }}
        onClick={() => onToggle(nodeId)}
        title={node.info || node.name}
      >
        <p className="font-bold font-serif text-ink dark:text-dark-text text-xs sm:text-sm whitespace-nowrap text-center">
          {node.name}
        </p>
      </div>

      {/* 展开/折叠指示器 */}
      {node.childCount > 0 && (
        <div
          className={`flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm whitespace-nowrap cursor-pointer select-none transition-colors
            ${isCollapsed
              ? 'bg-cinnabar/10 dark:bg-cinnabar/20 border-cinnabar/40 dark:border-cinnabar/60 text-cinnabar dark:text-dark-cinnabar hover:bg-cinnabar/20'
              : 'bg-forest/10 dark:bg-forest/20 border-forest/40 dark:border-forest/60 text-forest dark:text-dark-forest hover:bg-forest/20'
            }`}
          onClick={(e) => { e.stopPropagation(); onToggle(nodeId); }}
        >
          {isCollapsed ? (
            <>
              <ChevronRightIcon className="h-3 w-3" />
              <span>{node.childCount}人</span>
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-3 w-3" />
              <span>收起</span>
            </>
          )}
        </div>
      )}

      {/* 子节点 */}
      {children.length > 0 && (
        <>
          {/* 竖线（父到分叉） */}
          <div className="w-px h-4 bg-amber-300/50 dark:bg-amber-600/30" />

          {/* 子树容器 */}
          <div className="flex items-start gap-0">
            {children.map((cid, idx) => (
              <div key={cid} className="flex flex-col items-center relative">
                {/* 横线连接 */}
                <div className="flex items-center">
                  {/* 左横线（非第一个子节点） */}
                  {idx > 0 && (
                    <div className="w-3 sm:w-4 h-px bg-amber-300/50 dark:bg-amber-600/30" />
                  )}
                  {/* 竖线（子到卡片） */}
                  <div className="w-px h-4 bg-amber-300/50 dark:bg-amber-600/30" />
                </div>
                {/* 递归子节点 */}
                <TreeItem
                  nodeId={cid}
                  nodeMap={nodeMap}
                  collapsedIds={collapsedIds}
                  onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
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

  // Pan/zoom
  const containerRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroy: (() => void) | null = null;
    import('@panzoom/panzoom').then(({ default: Panzoom }) => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const pz = Panzoom(containerRef.current, {
        maxScale: 4,
        minScale: 0.05,
        startScale: 0.7,
        startX: 0,
        startY: 0,
        cursor: 'grab',
      });

      parent.addEventListener('wheel', pz.zoomWithWheel);
      containerRef.current.addEventListener('panzoomchange', (e: any) => {
        // Sync zoom buttons
        const btns = parent.querySelectorAll('.zoom-btn');
        btns[0]?.classList.toggle('opacity-30', e.detail.scale >= 4);
        btns[1]?.classList.toggle('opacity-30', e.detail.scale <= 0.1);
      });

      panzoomRef.current = pz;

      // 初始居中
      setTimeout(() => {
        if (!parent || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        pz.pan(
          (parent.clientWidth / 2) - (rect.width * 0.7 / 2),
          20
        );
      }, 100);

      destroy = () => {
        parent.removeEventListener('wheel', pz.zoomWithWheel);
        pz.destroy();
      };
    });

    return () => { destroy?.(); };
  }, []);

  const handleZoomIn = useCallback(() => {
    panzoomRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    panzoomRef.current?.zoomOut();
  }, []);

  const handleFitView = useCallback(() => {
    if (!containerRef.current || !panzoomRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = parent.clientWidth / (rect.width + 80);
    const scaleY = parent.clientHeight / (rect.height + 80);
    const scale = Math.min(scaleX, scaleY, 1.5);
    panzoomRef.current.zoomTo(scale);
    panzoomRef.current.pan(
      (parent.clientWidth - rect.width * scale) / 2,
      20
    );
  }, []);

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
          <p className="text-[10px] sm:text-xs text-muted dark:text-dark-muted">
            点击卡片展开/折叠 · 滚轮缩放 · 拖拽移动
          </p>
        </div>

        {/* 画布区域 */}
        <div
          ref={containerRef.current ? undefined : undefined}
          className="w-full h-[70vh] sm:h-[80vh] relative overflow-hidden bg-paper dark:bg-dark-bg cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #8B2500 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {/* 可平移缩放的树内容 */}
          <div ref={containerRef} className="origin-top-left">
            <div className="flex gap-6 p-8">
              {rootIds.map(rid => (
                <TreeItem
                  key={rid}
                  nodeId={rid}
                  nodeMap={treeMap}
                  collapsedIds={collapsedIds}
                  onToggle={toggleNode}
                />
              ))}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={handleZoomIn}
              className="zoom-btn w-9 h-9 flex items-center justify-center bg-card dark:bg-dark-card rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors text-lg font-bold"
              title="放大"
            >+</button>
            <button
              onClick={handleZoomOut}
              className="zoom-btn w-9 h-9 flex items-center justify-center bg-card dark:bg-dark-card rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors text-lg font-bold"
              title="缩小"
            >−</button>
            <button
              onClick={handleFitView}
              className="w-9 h-9 flex items-center justify-center bg-card dark:bg-dark-card rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors"
              title="适应视图"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          </div>

          {/* 展开全部 / 折叠全部 */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setCollapsedIds(new Set())}
              className="px-3 py-1.5 text-xs bg-card dark:bg-dark-card rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors"
            >
              展开全部
            </button>
            <button
              onClick={() => {
                const s = new Set<string>();
                treeMap.forEach((node) => {
                  if (node.depth >= 1) s.add(node.id);
                });
                setCollapsedIds(s);
              }}
              className="px-3 py-1.5 text-xs bg-card dark:bg-dark-card rounded-lg shadow-md border border-border dark:border-dark-border text-ink dark:text-dark-text hover:bg-cinnabar/10 transition-colors"
            >
              折叠全部
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
