
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


interface NodalGraphViewProps {
  items: ProcessedItem[];
  brands: Brand[];
  onCategorySelect: (categoryName: string) => void;
  activeCategoryName: string;
}

interface Link {
  source: string; // ID of source node
  target: string; // ID of target node
  gradientId?: string; // Optional ID for gradient
}

// Catégories fixes et leurs positions angulaires pour une disposition radiale
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
  if (activityColor) {
    return activityColor;
  }
  switch (type) {
    case 'center':
      return isDark ? '#FFFFFF' : '#000000';
    case 'category':
      return isDark ? '#A0A0A0' : '#555555';
    case 'item':
    default:
      return isDark ? '#666666' : '#999999';
  }
};

const ZOOM_LEVEL_CATEGORY = 1.2;
const ZOOM_LEVEL_OVERVIEW = 0.4;
const ATTRACTION_RADIUS = 150; // World units

export const NodalGraphView: React.FC<NodalGraphViewProps> = ({ items, brands, onCategorySelect, activeCategoryName }) => {
  const { resolvedTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const panZoomRef = useRef<PanZoomApi>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isUserPanning, setIsUserPanning] = useState(false);

  const { simulatedNodes, setNodes: setSimulationNodes } = useSimulation();

  const activityColorMap = useMemo(() => {
    return createActivityColorMap(brands, resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [brands, resolvedTheme]);

  const activityLogoMap = useMemo(() => {
    const map: Record<string, string> = {};
    brands.forEach(brand => {
        if (brand.Activity && brand.Logo) {
            map[brand.Activity] = brand.Logo;
        }
    });
    return map;
  }, [brands]);

  const cyberClubLogo = useMemo(() => {
      const brand = brands.find(b => b.Brand === 'Cyber Club');
      return brand?.Logo || null;
  }, [brands]);


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

  const categoryNodes = useMemo(() => {
    return simulatedNodes.filter(n => n.type === 'category' || n.type === 'center');
  }, [simulatedNodes]);

  useEffect(() => {
    const categoryRadius = 350; 
    const itemRadius = 60;
    
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];

    // 1. Centre Node
    const centerNode: Node = {
      id: 'center',
      x: 0, y: 0,
      vx: 0, vy: 0,
      radius: 33.6,
      label: 'Cyber Club',
      type: 'center',
      attractor: { x: 0, y: 0 },
      parentAttractor: null,
      color: getNodeColor(resolvedTheme, 'center'),
      logoUrl: cyberClubLogo,
    };
    newNodes.push(centerNode);

    // 2. Category Nodes
    const categoryNodesMap: Record<string, Node> = {};
    sortedVisibleCategories.forEach(cat => {
      const angle = (CATEGORY_ANGLES[cat]) * (Math.PI / 180);
      const attractor = {
        x: categoryRadius * Math.cos(angle),
        y: categoryRadius * Math.sin(angle),
      };
      const catNode: Node = {
        id: `cat-${cat}`,
        x: attractor.x, y: attractor.y,
        vx: 0, vy: 0,
        radius: 36,
        label: cat,
        type: 'category',
        attractor,
        parentAttractor: centerNode.attractor,
        color: getNodeColor(resolvedTheme, 'category', activityColorMap[cat]),
        logoUrl: activityLogoMap[cat] || null,
      };
      categoryNodesMap[cat] = catNode;
      newNodes.push(catNode);
      newLinks.push({ 
        source: 'center', 
        target: catNode.id,
        gradientId: `grad-${catNode.id}`
      });
    });
    
    // 3. Group items by their activities
    const itemsByActivity: Record<string, ProcessedItem[]> = {};
    items.forEach(item => {
        const itemActivities = item.Activity?.split(',').map(c => c.trim()).filter(Boolean);
        if (itemActivities && itemActivities.length > 0) {
            itemActivities.forEach(activity => {
                if (!itemsByActivity[activity]) itemsByActivity[activity] = [];
                itemsByActivity[activity].push(item);
            });
        }
    });

    // 4. Create Item Nodes
    Object.keys(itemsByActivity).forEach(activityName => {
        const activityItems = itemsByActivity[activityName];
        if (!activityItems || activityItems.length === 0) return;
        
        const angleStep = (2 * Math.PI) / activityItems.length;
        
        const parentNode = activityName === 'Cyber Club' ? centerNode : categoryNodesMap[activityName];
        if (!parentNode) return;
        
        activityItems.forEach((item, index) => {
            const angle = index * angleStep;
            const attractor = {
                x: parentNode.attractor.x + itemRadius * Math.cos(angle),
                y: parentNode.attractor.y + itemRadius * Math.sin(angle),
            };
            const itemNode: Node = {
                id: `${item.id}-${activityName}`,
                x: attractor.x, y: attractor.y,
                vx: 0, vy: 0, radius: 6, label: item.title, type: 'item',
                attractor,
                parentAttractor: parentNode.attractor,
                color: parentNode.color,
                href: item.pdfUrl || '#'
            };
            newNodes.push(itemNode);
            newLinks.push({ source: parentNode.id, target: itemNode.id });
        });
    });
    
    setLinks(newLinks);
    setSimulationNodes(newNodes);
  }, [items, sortedVisibleCategories, resolvedTheme, setSimulationNodes, activityColorMap, activityLogoMap, cyberClubLogo]);


  const handleTransformChange = useCallback((state: PanZoomState) => {
    if (isUserPanning) return; // Don't attract while user is actively panning

    let closestNode: Node | null = null;
    let minDistance = Infinity;

    for (const node of categoryNodes) {
        const distance = Math.sqrt(
            Math.pow(node.x - state.centerX, 2) + Math.pow(node.y - state.centerY, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }

    if (closestNode && minDistance < ATTRACTION_RADIUS / state.zoom) {
        if (activeCategoryName !== closestNode.label) {
            onCategorySelect(closestNode.label);
        }
    } else {
        if (activeCategoryName !== "Vue d'ensemble") {
            onCategorySelect("Vue d'ensemble");
        }
    }
  }, [isUserPanning, categoryNodes, activeCategoryName, onCategorySelect]);


  useEffect(() => {
    if (isUserPanning || !simulatedNodes.length) return;
    
    let nodeToZoom: Node | undefined;
    let zoomLevel = ZOOM_LEVEL_OVERVIEW;

    if (activeCategoryName !== "Vue d'ensemble") {
        nodeToZoom = simulatedNodes.find(n => n.label === activeCategoryName);
        zoomLevel = ZOOM_LEVEL_CATEGORY;
    } else {
        nodeToZoom = simulatedNodes.find(n => n.type === 'center');
    }

    if (nodeToZoom) {
        panZoomRef.current?.zoomTo(nodeToZoom.x, nodeToZoom.y, zoomLevel, true);
    }
  }, [activeCategoryName, isUserPanning, simulatedNodes]);

  const onNodeClick = useCallback((node: Node) => {
    setIsUserPanning(false);
    if (node.type === 'category' || node.type === 'center') {
      onCategorySelect(node.label);
    } else if (node.href && node.href !== '#') {
      window.open(node.href, '_blank');
    }
  }, [onCategorySelect]);
  
  const handleManualPan = useCallback(() => {
      setIsUserPanning(true);
      onCategorySelect("Vue d'ensemble");
  }, [onCategorySelect]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    simulatedNodes.forEach(node => map.set(node.id, node));
    return map;
  }, [simulatedNodes]);

  const lockedCategoryId = useMemo(() => {
      if (activeCategoryName === "Vue d'ensemble") return null;
      if (activeCategoryName === "Cyber Club") return 'center';
      return `cat-${activeCategoryName}`;
  }, [activeCategoryName]);

  const itemLinks = useMemo(() => {
      if (!lockedCategoryId) return new Set();
      const items = new Set<string>();
      links.forEach(link => {
          if (link.source === lockedCategoryId) {
              items.add(link.target);
          }
      });
      return items;
  }, [links, lockedCategoryId]);

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
        onTransformChange={handleTransformChange}
        onManualPan={handleManualPan}
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
        
        {/* Render Links */}
        <g>
          {links.map((link, i) => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (!source || !target) return null;

            const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
            const isRelatedToLocked = (lockedCategoryId === source.id && itemLinks.has(target.id)) || (lockedCategoryId === target.id);
            const isGradientLink = !!link.gradientId;
            
            const lineProps = {
                x1: source.x,
                y1: source.y,
                x2: target.x,
                y2: target.y,
                stroke: isGradientLink ? `url(#${link.gradientId})` : source.color,
                strokeWidth: isHovered || isRelatedToLocked ? "1.5" : "0.5",
                strokeOpacity: isHovered || isRelatedToLocked ? (isGradientLink ? 1 : 1) : (isGradientLink ? 0.8 : 0.4),
                className: "transition-all duration-300",
            };

            const angle = Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
            if (isGradientLink) {
              const gradRef = document.getElementById(link.gradientId!);
               if (gradRef) {
                 gradRef.setAttribute('gradientTransform', `rotate(${angle}, ${source.x}, ${source.y})`);
               }
            }
            
            return <line key={i} {...lineProps} />;
          })}
        </g>
        
        {/* Render Nodes */}
        {simulatedNodes.map(node => (
          <NodalGraphNode
            key={node.id}
            node={node}
            isHovered={hoveredNodeId === node.id}
            isLocked={lockedCategoryId === node.id}
            isAnotherNodeLocked={!!lockedCategoryId && lockedCategoryId !== node.id}
            isEmphasized={itemLinks.has(node.id)}
            onClick={onNodeClick}
            onHover={setHoveredNodeId}
          />
        ))}
      </PanZoom>
    </div>
  );
};
