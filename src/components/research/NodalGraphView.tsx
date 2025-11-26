
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Brand, ProcessedItem } from '@/lib/sheets';
import { useSimulation, type Node } from './use-simulation';
import { NodalGraphNode } from './NodalGraphNode';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PanZoom, type PanZoomApi, type PanZoomState } from './PanZoom';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { createActivityColorMap } from '@/lib/color-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '../ui/button';
import Image from 'next/image';


interface NodalGraphViewProps {
  items: ProcessedItem[];
  brands: Brand[];
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
const ATTRACTION_RADIUS = 30; // Screen pixels - REDUCED from 50 to make escaping easier

export const NodalGraphView: React.FC<NodalGraphViewProps> = ({ items, brands }) => {
  const { resolvedTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const panZoomRef = useRef<PanZoomApi>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0); // 0 for overview
  const [lockedCategoryId, setLockedCategoryId] = useState<string | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout>();

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


  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
        const itemCategories = item.Activity?.split(',').map(c => c.trim()) || [];
        itemCategories.forEach(cat => categories.add(cat));
    });
    // Ensure all predefined categories exist for stable layout
    Object.keys(CATEGORY_ANGLES).forEach(cat => categories.add(cat));
    
    return Array.from(categories);
  }, [items]);

  const sortedVisibleCategories = useMemo(() => {
      return allCategories
          .filter(cat => cat !== 'Cyber Club' && cat !== 'Cybernetics' && cat !== 'Other' && CATEGORY_ANGLES[cat] !== undefined)
          .sort((a, b) => CATEGORY_ANGLES[a] - CATEGORY_ANGLES[b]);
  }, [allCategories]);

  const navigationCategories = useMemo(() => ['Vue d\'ensemble', ...sortedVisibleCategories], [sortedVisibleCategories]);

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
      radius: 33.6, // Original: 24 -> 33.6 (40% increase)
      label: 'Cyber Club',
      type: 'center',
      attractor: { x: 0, y: 0 },
      parentAttractor: null,
      color: getNodeColor(resolvedTheme, 'center'),
      logoUrl: cyberClubLogo,
    };
    newNodes.push(centerNode);

    // 2. Category Nodes (excluding Cyber Club)
    const categoryNodes: Record<string, Node> = {};
    
    sortedVisibleCategories.forEach(cat => {
      const angle = (CATEGORY_ANGLES[cat]) * (Math.PI / 180);
      const attractor = {
        x: categoryRadius * Math.cos(angle),
        y: categoryRadius * Math.sin(angle),
      };
      const catNode: Node = {
        id: `cat-${cat}`,
        x: attractor.x + (Math.random() - 0.5) * 50,
        y: attractor.y + (Math.random() - 0.5) * 50,
        vx: 0, vy: 0,
        radius: 36, // Original: 12 -> Tripled to 36
        label: cat,
        type: 'category',
        attractor,
        parentAttractor: centerNode.attractor,
        color: getNodeColor(resolvedTheme, 'category', activityColorMap[cat]),
        logoUrl: activityLogoMap[cat] || null,
      };
      categoryNodes[cat] = catNode;
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
        
        if (activityName === 'Cyber Club') {
            activityItems.forEach((item, index) => {
                const angle = index * angleStep;
                const attractor = {
                    x: centerNode.x + itemRadius * 1.5 * Math.cos(angle),
                    y: centerNode.y + itemRadius * 1.5 * Math.sin(angle),
                };
                const itemNode: Node = {
                    id: `${item.id}-${activityName}`,
                    x: attractor.x, y: attractor.y,
                    vx: 0, vy: 0, radius: 6, label: item.title, type: 'item',
                    attractor,
                    parentAttractor: centerNode.attractor,
                    color: getNodeColor(resolvedTheme, 'item', activityColorMap.Cybernetics),
                    href: item.pdfUrl || '#'
                };
                newNodes.push(itemNode);
                newLinks.push({ source: centerNode.id, target: itemNode.id });
            });
        } else {
            const categoryNode = categoryNodes[activityName];
            if (!categoryNode) return;

            activityItems.forEach((item, index) => {
                const angle = index * angleStep;
                const attractor = {
                    x: categoryNode.attractor.x + itemRadius * Math.cos(angle),
                    y: categoryNode.attractor.y + itemRadius * Math.sin(angle),
                };
                const itemNode: Node = {
                    id: `${item.id}-${activityName}`,
                    x: attractor.x, y: attractor.y,
                    vx: 0, vy: 0, radius: 6, label: item.title, type: 'item',
                    attractor,
                    parentAttractor: categoryNode.attractor,
                    color: categoryNode.color,
                    href: item.pdfUrl || '#'
                };
                newNodes.push(itemNode);
                newLinks.push({ source: categoryNode.id, target: itemNode.id });
            });
        }
    });
    
    setLinks(newLinks);
    setSimulationNodes(newNodes);

    const timeout = setTimeout(() => {
        panZoomRef.current?.zoomTo(0, 0, ZOOM_LEVEL_OVERVIEW, true);
    }, 500);

    return () => clearTimeout(timeout);

  }, [items, sortedVisibleCategories, resolvedTheme, setSimulationNodes, activityColorMap, activityLogoMap, cyberClubLogo]);

  const onNodeClick = useCallback((node: Node) => {
    if (node.href && node.href !== '#') {
      window.open(node.href, '_blank');
    }
  }, []);

  const handleCategorySelect = useCallback((categoryName: string) => {
      const index = navigationCategories.findIndex(c => c === categoryName);
      if (index === -1) return;
      
      setCurrentCategoryIndex(index);

      if (index === 0 || categoryName === 'all') { // "Vue d'ensemble"
          panZoomRef.current?.zoomTo(0, 0, ZOOM_LEVEL_OVERVIEW, true);
          setIsLocked(false);
          setLockedCategoryId(null);
          return;
      }
      
      const categoryId = `cat-${categoryName}`;
      const nodeToZoom = simulatedNodes.find(n => n.id === categoryId);
      if (nodeToZoom) {
          panZoomRef.current?.zoomTo(nodeToZoom.x, nodeToZoom.y, ZOOM_LEVEL_CATEGORY, true);
          setIsLocked(true);
          setLockedCategoryId(nodeToZoom.id);
      }
  }, [navigationCategories, simulatedNodes]);

  const navigateCategories = (direction: 'next' | 'prev') => {
      const newIndex = direction === 'next'
          ? (currentCategoryIndex + 1) % navigationCategories.length
          : (currentCategoryIndex - 1 + navigationCategories.length) % navigationCategories.length;
      
      handleCategorySelect(navigationCategories[newIndex]);
  };

  const handleManualPan = () => {
    setIsLocked(false); // Unlock on manual interaction
    setLockedCategoryId(null);
    setCurrentCategoryIndex(0); // Go back to overview state
    clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
    }, 1500);
  };
  
  const handleTransformChange = useCallback((state: PanZoomState) => {
    if (isLocked) return;

    // Find the category node closest to the center
    const { centerX, centerY } = state;
    let closestNode: Node | null = null;
    let minDistance = Infinity;

    for (const node of simulatedNodes) {
      if (node.type !== 'category') continue;
      
      const distance = Math.sqrt(Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2));

      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }

    if (closestNode && minDistance * state.zoom < ATTRACTION_RADIUS) {
      handleCategorySelect(closestNode.label);
    }
  }, [isLocked, simulatedNodes, handleCategorySelect]);
  
  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    simulatedNodes.forEach(node => map.set(node.id, node));
    return map;
  }, [simulatedNodes]);

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
  
  const currentCategoryName = navigationCategories[currentCategoryIndex];
  const currentCategoryBrand = brands.find(b => b.Activity === currentCategoryName);
  const currentCategoryLogo = currentCategoryName === 'Vue d\'ensemble' 
    ? cyberClubLogo
    : currentCategoryBrand?.Logo || null;


  return (
    <div className="relative w-full h-full bg-background/50 backdrop-blur-sm overflow-hidden">
      {!hasSimulated && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground z-10">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Initializing simulation...</span>
        </div>
      )}
      
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md" 
            onClick={() => navigateCategories('prev')}
            style={{ color: 'var(--brand-color)' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div 
            className="px-6 py-2 rounded-full bg-background/70 backdrop-blur-md font-headline uppercase text-center min-w-[250px] flex items-center justify-center gap-3"
            style={{ color: 'var(--brand-color)', borderColor: 'var(--brand-color)' }}
          >
            {currentCategoryLogo && (
              <Image 
                src={currentCategoryLogo} 
                alt={`${currentCategoryName} logo`}
                width={20}
                height={20}
                className={cn(currentCategoryName !== 'Vue d\'ensemble' && 'dark:invert')}
                style={{ filter: resolvedTheme === 'dark' && currentCategoryName !== 'Vue d\'ensemble' ? 'invert(1)' : 'none' }}
              />
            )}
            <span>{currentCategoryName}</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md" 
            onClick={() => navigateCategories('next')}
            style={{ color: 'var(--brand-color)' }}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
      </div>

      <PanZoom
        ref={panZoomRef}
        minZoom={0.05}
        maxZoom={3}
        className={cn("w-full h-full transition-opacity duration-500", hasSimulated ? 'opacity-100' : 'opacity-0')}
        onManualPan={handleManualPan}
        onTransformChange={handleTransformChange}
      >
        <defs>
          {links.filter(l => l.gradientId).map(link => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (!source || !target) return null;
            
            // Use the brand color if available, otherwise fallback to the node's own color
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
                key: i,
                x1: source.x,
                y1: source.y,
                x2: target.x,
                y2: target.y,
                stroke: isGradientLink ? `url(#${link.gradientId})` : source.color,
                strokeWidth: isHovered || isRelatedToLocked ? "1.5" : "0.5",
                strokeOpacity: isHovered || isRelatedToLocked ? (isGradientLink ? 1 : 1) : (isGradientLink ? 0.8 : 0.4),
                className: "transition-all duration-300",
            };

            // Hack to apply gradient to line, needs to be calculated
            const angle = Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
            if (isGradientLink) {
              const gradientTransform = `rotate(${angle}, ${source.x}, ${source.y})`;
               const gradRef = document.getElementById(link.gradientId!);
               if (gradRef) {
                 gradRef.setAttribute('gradientTransform', gradientTransform);
               }
            }
            
            return <line {...lineProps} />;
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

    