
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Brand, ProcessedItem } from '@/lib/sheets';
import { useSimulation, type Node } from './use-simulation';
import { NodalGraphNode } from './NodalGraphNode';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PanZoom, type PanZoomApi, type PanZoomState } from './PanZoom';
import { Loader2 } from 'lucide-react';
import { createActivityColorMap } from '@/lib/color-utils';
import { useDebouncedCallback } from 'use-debounce';

interface NodalGraphViewProps {
  items: ProcessedItem[];
  brands: Brand[];
  onCategorySelect: (categoryName: string) => void;
  activeCategoryName: string;
}

interface Link {
  source: string;
  target: string;
  gradientId?: string;
}

type ViewState = 
  | { level: 'overview' }
  | { level: 'category', targetId: string }
  | { level: 'item', targetId: string };

const ZOOM_LEVELS = {
  overview: 0.35,
  category: 2,
  item: 2,
};

const CATEGORY_ANGLES: Record<string, number> = {
  'Design': 0,
  'Architecture': 60,
  'Multimedias': 120,
  'Textile': 180,
  'Nature': 240,
  'Mecatronics': 300,
};

const getNodeColor = (theme: string | undefined, type: 'center' | 'category' | 'item', activityColor?: string) => {
  const isDark = theme === 'dark';
  if (activityColor) return activityColor;
  switch (type) {
    case 'center': return isDark ? '#FFFFFF' : '#000000';
    case 'category': return isDark ? '#A0A0A0' : '#555555';
    case 'item': default: return isDark ? '#666666' : '#999999';
  }
};

const ATTRACTION_RADIUS = 150; // Screen pixels

export const NodalGraphView: React.FC<NodalGraphViewProps> = ({ items, brands, onCategorySelect }) => {
  const { resolvedTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const panZoomRef = useRef<PanZoomApi>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>({ level: 'overview' });

  const { simulatedNodes, setNodes: setSimulationNodes, forceUpdate } = useSimulation();

  const activityColorMap = useMemo(() => createActivityColorMap(brands, resolvedTheme === 'dark' ? 'dark' : 'light'), [brands, resolvedTheme]);
  const activityLogoMap = useMemo(() => {
    const map: Record<string, string> = {};
    brands.forEach(brand => { if (brand.Activity && brand.Logo) map[brand.Activity] = brand.Logo; });
    return map;
  }, [brands]);
  const cyberClubLogo = useMemo(() => brands.find(b => b.Brand === 'Cyber Club')?.Logo || null, [brands]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    simulatedNodes.forEach(node => map.set(node.id, node));
    return map;
  }, [simulatedNodes]);

  const sortedVisibleCategories = useMemo(() => {
      const categories = new Set<string>();
      items.forEach(item => {
          const itemCategories = item.Activity?.split(',').map(c => c.trim()) || [];
          itemCategories.forEach(cat => categories.add(cat));
      });
      Object.keys(CATEGORY_ANGLES).forEach(cat => categories.add(cat));
      
      return Array.from(categories)
          .filter(cat => cat !== 'Cyber Club' && cat !== 'Cybernetics' && cat !== 'Other' && CATEGORY_ANGLES[cat] !== undefined)
          .sort((a, b) => CATEGORY_ANGLES[a] - CATEGORY_ANGLES[b]);
  }, [items]);

  useEffect(() => {
    const categoryRadius = 350;
    const itemRadius = 60;
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];

    const centerNode: Node = {
      id: 'center', x: 0, y: 0, vx: 0, vy: 0, radius: 33.6, label: 'Cyber Club', type: 'center',
      attractor: { x: 0, y: 0 }, parentAttractor: null, color: getNodeColor(resolvedTheme, 'center'), logoUrl: cyberClubLogo,
    };
    newNodes.push(centerNode);

    const categoryNodesMap: Record<string, Node> = {};
    sortedVisibleCategories.forEach(cat => {
      const angle = CATEGORY_ANGLES[cat] * (Math.PI / 180);
      const attractor = { x: categoryRadius * Math.cos(angle), y: categoryRadius * Math.sin(angle) };
      const catNode: Node = {
        id: `cat-${cat}`, x: attractor.x, y: attractor.y, vx: 0, vy: 0, radius: 36, label: cat, type: 'category',
        attractor, parentAttractor: centerNode.attractor, color: getNodeColor(resolvedTheme, 'category', activityColorMap[cat]), logoUrl: activityLogoMap[cat] || null,
      };
      categoryNodesMap[cat] = catNode;
      newNodes.push(catNode);
      newLinks.push({ source: 'center', target: catNode.id, gradientId: `grad-${catNode.id}` });
    });

    const itemsByActivity: Record<string, ProcessedItem[]> = {};
    items.forEach(item => {
      const itemActivities = item.Activity?.split(',').map(c => c.trim()).filter(Boolean);
      if (itemActivities?.length) {
        itemActivities.forEach(activity => {
          if (!itemsByActivity[activity]) itemsByActivity[activity] = [];
          itemsByActivity[activity].push(item);
        });
      }
    });

    Object.keys(itemsByActivity).forEach(activityName => {
      const activityItems = itemsByActivity[activityName];
      if (!activityItems?.length) return;
      const angleStep = (2 * Math.PI) / activityItems.length;
      const parentNode = activityName === 'Cyber Club' ? centerNode : categoryNodesMap[activityName];
      if (!parentNode) return;
      activityItems.forEach((item, index) => {
        const angle = index * angleStep;
        const attractor = { x: parentNode.attractor.x + itemRadius * Math.cos(angle), y: parentNode.attractor.y + itemRadius * Math.sin(angle) };
        const itemNode: Node = {
          id: `${item.id}-${activityName}`, x: attractor.x, y: attractor.y, vx: 0, vy: 0, radius: 6, label: item.title, type: 'item',
          attractor, parentAttractor: parentNode.attractor, color: parentNode.color, href: item.pdfUrl || '#'
        };
        newNodes.push(itemNode);
        newLinks.push({ source: parentNode.id, target: itemNode.id });
      });
    });

    setLinks(newLinks);
    setSimulationNodes(newNodes);
  }, [items, sortedVisibleCategories, resolvedTheme, setSimulationNodes, activityColorMap, activityLogoMap, cyberClubLogo]);
  
  const onNodeClick = useCallback((node: Node) => {
    if (viewState.level === 'category' && node.id === viewState.targetId) {
        setViewState({ level: 'overview' });
    } else if (node.type === 'category') {
        setViewState({ level: 'category', targetId: node.id });
    } else if (node.type === 'center') {
        setViewState({ level: 'overview' });
    } else if (node.type === 'item') {
        setViewState({ level: 'item', targetId: node.id });
    }
  }, [viewState]);

  const handleZoomRequest = useCallback((deltaY: number, mouseX: number, mouseY: number) => {
    // Zooming Out
    if (deltaY > 0) {
      if (viewState.level === 'item') {
        const itemNode = nodeMap.get(viewState.targetId);
        const parentId = links.find(l => l.target === itemNode?.id)?.source;
        if (parentId) setViewState({ level: 'category', targetId: parentId });
      } else if (viewState.level === 'category') {
        setViewState({ level: 'overview' });
      }
      return;
    }
    
    // Zooming In: find closest node to mouse
    let closestNode: Node | null = null;
    let minDistance = Infinity;

    for (const node of simulatedNodes) {
      if (node.type === 'center') continue; // Don't snap to center
      const distance = Math.sqrt(Math.pow(node.x - mouseX, 2) + Math.pow(node.y - mouseY, 2));
      if (distance < node.radius * 2 && distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }

    if (closestNode) {
       if (closestNode.type === 'category') {
            setViewState({ level: 'category', targetId: closestNode.id });
       } else if (closestNode.type === 'item' && viewState.level === 'category') {
            setViewState({ level: 'item', targetId: closestNode.id });
       }
    }
  }, [viewState, simulatedNodes, links, nodeMap]);

  const handlePan = useDebouncedCallback((state: PanZoomState, isPanning: boolean) => {
    if (isPanning) {
        const centerX = -state.x / state.zoom + (panZoomRef.current?.getDimensions().width ?? 0) / (2 * state.zoom);
        const centerY = -state.y / state.zoom + (panZoomRef.current?.getDimensions().height ?? 0) / (2 * state.zoom);

        let closestCatNode: Node | null = null;
        let minDistance = Infinity;

        for (const node of simulatedNodes) {
            if (node.type !== 'category') continue;
            const dist = Math.sqrt(Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestCatNode = node;
            }
        }
        
        if (closestCatNode && minDistance < ATTRACTION_RADIUS) {
            setViewState({ level: 'category', targetId: closestCatNode.id });
        }
    }
  }, 200);

  useEffect(() => {
    let targetNode: Node | undefined;
    let zoomLevel: number;

    switch (viewState.level) {
        case 'category':
            targetNode = nodeMap.get(viewState.targetId);
            zoomLevel = ZOOM_LEVELS.category;
            onCategorySelect(targetNode?.label || "Vue d'ensemble");
            break;
        case 'item':
            targetNode = nodeMap.get(viewState.targetId);
            zoomLevel = ZOOM_LEVELS.item;
            const parentId = links.find(l => l.target === targetNode?.id)?.source;
            const parentNode = nodeMap.get(parentId || '');
            onCategorySelect(parentNode?.label || "Vue d'ensemble");
            break;
        case 'overview':
        default:
            targetNode = simulatedNodes.find(n => n.type === 'center');
            zoomLevel = ZOOM_LEVELS.overview;
            onCategorySelect("Vue d'ensemble");
            break;
    }
    
    if (targetNode) {
      panZoomRef.current?.zoomTo(targetNode.x, targetNode.y, zoomLevel, true);
    }
  }, [viewState, nodeMap, onCategorySelect, links, simulatedNodes]);

  const activeCategoryId = useMemo(() => {
    if (viewState.level === 'category') return viewState.targetId;
    if (viewState.level === 'item') {
        const itemNode = nodeMap.get(viewState.targetId);
        const parentId = links.find(l => l.target === itemNode?.id)?.source;
        return parentId;
    }
    return null;
  }, [viewState, links, nodeMap]);

  const itemLinks = useMemo(() => {
    if (!activeCategoryId) return new Set();
    const items = new Set<string>();
    links.forEach(link => {
      if (link.source === activeCategoryId) items.add(link.target);
    });
    return items;
  }, [links, activeCategoryId]);

  const hasSimulated = simulatedNodes.length > 0;

  return (
    <div className="relative w-full h-full bg-background/50 backdrop-blur-sm overflow-hidden">
      {!hasSimulated && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground z-10">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Initializing simulation...</span>
        </div>
      )}

      <PanZoom
        ref={panZoomRef}
        minZoom={0.05}
        maxZoom={3}
        className={cn("w-full h-full transition-opacity duration-500", hasSimulated ? 'opacity-100' : 'opacity-0')}
        onZoomRequest={handleZoomRequest}
        onPan={handlePan}
        onManualPanStart={() => panZoomRef.current?.stopAnimation()}
      >
        <defs>
          {links.filter(l => l.gradientId).map(link => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (!source || !target) return null;
            const targetBrandColor = brands.find(b => b.Activity === target.label)?.['Color Light'];
            const finalTargetColor = targetBrandColor ? `#${targetBrandColor}` : target.color;
            return (
              <linearGradient key={link.gradientId} id={link.gradientId} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                <stop offset="0%" style={{ stopColor: source.color, stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: finalTargetColor, stopOpacity: 1 }} />
              </linearGradient>
            );
          })}
        </defs>
        
        <g>
          {links.map((link, i) => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (!source || !target) return null;
            const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
            const isRelatedToActive = (activeCategoryId === source.id && itemLinks.has(target.id)) || (activeCategoryId === target.id);
            const isGradientLink = !!link.gradientId;
            const lineProps = {
                x1: source.x, y1: source.y, x2: target.x, y2: target.y,
                stroke: isGradientLink ? `url(#${link.gradientId})` : source.color,
                strokeWidth: isHovered || isRelatedToActive ? "1.5" : "0.5",
                strokeOpacity: isHovered || isRelatedToActive ? 1 : (isGradientLink ? 0.8 : 0.4),
                className: "transition-all duration-300",
            };
            const angle = Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
            if (isGradientLink) {
              const gradRef = document.getElementById(link.gradientId!);
              if (gradRef) gradRef.setAttribute('gradientTransform', `rotate(${angle}, ${source.x}, ${source.y})`);
            }
            return <line key={i} {...lineProps} />;
          })}
        </g>
        
        {simulatedNodes.map(node => (
          <NodalGraphNode
            key={node.id}
            node={node}
            isHovered={hoveredNodeId === node.id}
            isLocked={activeCategoryId === node.id}
            isAnotherNodeLocked={!!activeCategoryId && activeCategoryId !== node.id && node.type === 'category'}
            isEmphasized={itemLinks.has(node.id)}
            onClick={onNodeClick}
            onHover={setHoveredNodeId}
          />
        ))}
      </PanZoom>
    </div>
  );
};
