
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ProcessedItem } from '@/lib/sheets';
import { useSimulation, type Node } from './use-simulation';
import { NodalGraphNode } from './NodalGraphNode';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PanZoom, type PanZoomApi } from './PanZoom';
import { Loader2 } from 'lucide-react';

interface NodalGraphViewProps {
  items: ProcessedItem[];
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

const getNodeColor = (theme: string | undefined, type: 'center' | 'category' | 'item') => {
  const isDark = theme === 'dark';
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

export const NodalGraphView: React.FC<NodalGraphViewProps> = ({ items }) => {
  const { resolvedTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const panZoomRef = useRef<PanZoomApi>(null);

  const { simulatedNodes, setNodes: setSimulationNodes } = useSimulation({
    attractionStiffness: 0.01,
    repulsionStiffness: 1000,
    damping: 0.95,
  });

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      const itemCategories = item.Activity?.split(',').map(c => c.trim()) || ['Other'];
      itemCategories.forEach(cat => categories.add(cat));
    });
    // Ensure all predefined categories exist for stable layout
    Object.keys(CATEGORY_ANGLES).forEach(cat => categories.add(cat));
    return Array.from(categories);
  }, [items]);

  useEffect(() => {
    const categoryRadius = 250;
    
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];

    // 1. Centre Node
    newNodes.push({
      id: 'center',
      x: 0, y: 0,
      vx: 0, vy: 0,
      radius: 20,
      label: 'Cyber Club',
      type: 'center',
      attractor: { x: 0, y: 0 },
      color: getNodeColor(resolvedTheme, 'center'),
    });

    // 2. Category Nodes
    const categoryNodes: Record<string, Node> = {};
    const sortedCategories = allCategories.sort((a, b) => (CATEGORY_ANGLES[a] ?? 999) - (CATEGORY_ANGLES[b] ?? 999));

    sortedCategories.forEach(cat => {
      // Utiliser l'angle prédéfini pour une disposition radiale parfaite
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
        color: getNodeColor(resolvedTheme, 'category'),
      };
      categoryNodes[cat] = catNode;
      newNodes.push(catNode);
      // Link from center to category
      newLinks.push({ source: 'center', target: catNode.id });
    });

    // 3. Item Nodes - DUPLICATE FOR MULTI-CATEGORY
    items.forEach(item => {
      const itemCategories = item.Activity?.split(',').map(c => c.trim()).filter(c => allCategories.includes(c));
      
      if (itemCategories.length === 0) {
        itemCategories.push('Other');
      }

      itemCategories.forEach(categoryName => {
        const categoryNode = categoryNodes[categoryName];
        if (categoryNode) {
          const itemNodeId = `${item.id}-${categoryName}`;
          
          const itemNode: Node = {
            id: itemNodeId,
            x: categoryNode.x + (Math.random() - 0.5) * 50,
            y: categoryNode.y + (Math.random() - 0.5) * 50,
            vx: 0, vy: 0,
            radius: 6,
            label: item.title,
            type: 'item',
            attractor: { x: categoryNode.x, y: categoryNode.y },
            color: getNodeColor(resolvedTheme, 'item'),
            href: item.pdfUrl || '#',
          };
          newNodes.push(itemNode);
          
          newLinks.push({ source: categoryNode.id, target: itemNode.id });
        }
      });
    });
    
    setLinks(newLinks);
    setSimulationNodes(newNodes);

    // Auto-frame on load
    const timeout = setTimeout(() => {
        panZoomRef.current?.zoomTo(0, 0, 0.5, false);
    }, 500);

    return () => clearTimeout(timeout);

  }, [items, allCategories, resolvedTheme, setSimulationNodes]);

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
        minZoom={0.1}
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
