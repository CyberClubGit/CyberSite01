
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Brand, ProcessedItem } from '@/lib/sheets';
import { useSimulation, type Node } from './use-simulation';
import { NodalGraphNode } from './NodalGraphNode';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PanZoom, type PanZoomApi } from './PanZoom';
import { Loader2 } from 'lucide-react';
import { createActivityColorMap } from '@/lib/color-utils';

interface NodalGraphViewProps {
  items: ProcessedItem[];
  brands: Brand[];
}

interface Link {
  source: string; // ID of source node
  target: string; // ID of target node
}

// Catégories fixes et leurs positions angulaires pour une disposition radiale
const CATEGORY_ANGLES: Record<string, number> = {
  'Design': 0,
  'Architecture': 45,
  'Multimedias': 90,
  'Textile': 135,
  'Nature': 180,
  'Mecatronics': 225,
  'Cybernetics': 270,
  'Other': 315,
};

const getNodeColor = (theme: string | undefined, type: 'center' | 'category' | 'item', activityColor?: string) => {
  const isDark = theme === 'dark';
  if (type === 'category' && activityColor) {
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

export const NodalGraphView: React.FC<NodalGraphViewProps> = ({ items, brands }) => {
  const { resolvedTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const panZoomRef = useRef<PanZoomApi>(null);

  const { simulatedNodes, setNodes: setSimulationNodes } = useSimulation();

  const activityColorMap = useMemo(() => {
    return createActivityColorMap(brands, resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [brands, resolvedTheme]);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
        // Inclure 'Cyber Club' comme une catégorie potentielle
        const itemCategories = item.Activity?.split(',').map(c => c.trim()) || ['Other'];
        if (itemCategories.length === 0) {
            categories.add('Other');
        } else {
            itemCategories.forEach(cat => categories.add(cat));
        }
    });
    // Ensure all predefined categories exist for stable layout
    Object.keys(CATEGORY_ANGLES).forEach(cat => categories.add(cat));
    
    // Explicitly filter out unwanted categories from the main ring
    return Array.from(categories).filter(cat => cat !== 'Cybernetics' && cat !== 'Other');
  }, [items]);

  useEffect(() => {
    const categoryRadius = 350; 
    const itemRadius = 80;     // Reduced radius to bring items closer
    
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];

    // 1. Centre Node
    const centerNode: Node = {
      id: 'center',
      x: 0, y: 0,
      vx: 0, vy: 0,
      radius: 20,
      label: 'Cyber Club',
      type: 'center',
      attractor: { x: 0, y: 0 },
      color: getNodeColor(resolvedTheme, 'center'),
    };
    newNodes.push(centerNode);

    // 2. Category Nodes (excluding Cyber Club)
    const categoryNodes: Record<string, Node> = {};
    const mainCategories = allCategories.filter(cat => cat !== 'Cyber Club');
    const sortedCategories = mainCategories.sort((a, b) => (CATEGORY_ANGLES[a] ?? 999) - (CATEGORY_ANGLES[b] ?? 999));
    
    sortedCategories.forEach(cat => {
      const angle = (CATEGORY_ANGLES[cat] ?? Math.random() * 360) * (Math.PI / 180);
      const attractor = {
        x: categoryRadius * Math.cos(angle),
        y: categoryRadius * Math.sin(angle),
      };
      const catNode: Node = {
        id: `cat-${cat}`,
        x: attractor.x + (Math.random() - 0.5) * 50,
        y: attractor.y + (Math.random() - 0.5) * 50,
        vx: 0, vy: 0,
        radius: 12,
        label: cat,
        type: 'category',
        attractor,
        color: getNodeColor(resolvedTheme, 'category', activityColorMap[cat]),
      };
      categoryNodes[cat] = catNode;
      newNodes.push(catNode);
      newLinks.push({ source: 'center', target: catNode.id });
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
        
        // **Perfect Radial Distribution**
        const angleStep = (2 * Math.PI) / (activityItems.length || 1);
        
        // Handle "Cyber Club" items as a special case
        if (activityName === 'Cyber Club') {
            activityItems.forEach((item, index) => {
                const angle = index * angleStep;
                const attractor = {
                    x: centerNode.x + itemRadius * 1.5 * Math.cos(angle), // a bit further out from center
                    y: centerNode.y + itemRadius * 1.5 * Math.sin(angle),
                };
                const itemNode: Node = {
                    id: `${item.id}-${activityName}`,
                    x: attractor.x, y: attractor.y,
                    vx: 0, vy: 0, radius: 6, label: item.title, type: 'item',
                    attractor,
                    color: getNodeColor(resolvedTheme, 'item'),
                    href: item.pdfUrl || '#'
                };
                newNodes.push(itemNode);
                newLinks.push({ source: centerNode.id, target: itemNode.id });
            });
        } else {
            // Handle regular category items
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
                    color: getNodeColor(resolvedTheme, 'item'),
                    href: item.pdfUrl || '#'
                };
                newNodes.push(itemNode);
                newLinks.push({ source: categoryNode.id, target: itemNode.id });
            });
        }
    });
    
    setLinks(newLinks);
    setSimulationNodes(newNodes);

    // Auto-frame on load
    const timeout = setTimeout(() => {
        panZoomRef.current?.zoomTo(0, 0, 0.4, false);
    }, 500);

    return () => clearTimeout(timeout);

  }, [items, allCategories, resolvedTheme, setSimulationNodes, activityColorMap]);

  const onNodeClick = useCallback((node: Node) => {
    if (node.href && node.href !== '#') {
      window.open(node.href, '_blank');
    }
  }, []);
  
  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    simulatedNodes.forEach(node => map.set(node.id, node));
    return map;
  }, [simulatedNodes]);

  const hasSimulated = simulatedNodes.length > 0;

  return (
    <div className="relative w-full h-[70vh] border rounded-lg bg-background/50 overflow-hidden">
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
      >
        {/* Render Links */}
        <g>
          {links.map((link, i) => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (!source || !target) return null;
            return (
              <line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={source.color}
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
            );
          })}
        </g>
        
        {/* Render Nodes */}
        {simulatedNodes.map(node => (
          <NodalGraphNode
            key={node.id}
            node={node}
            onClick={onNodeClick}
          />
        ))}
      </PanZoom>
    </div>
  );
};
