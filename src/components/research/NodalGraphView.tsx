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

// Catégories fixes et leurs positions angulaires
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
  const [nodes, setNodes] = useState<Node[]>([]);
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
    return Array.from(categories);
  }, [items]);

  useEffect(() => {
    const categoryRadius = 250;
    const itemRadius = 100;
    const centerAttractor = { x: 0, y: 0 };

    const initialNodes: Node[] = [];

    // 1. Centre Node
    initialNodes.push({
      id: 'center',
      x: 0, y: 0,
      vx: 0, vy: 0,
      radius: 20,
      label: 'Cyber Club',
      type: 'center',
      attractor: centerAttractor,
      color: getNodeColor(resolvedTheme, 'center'),
    });

    // 2. Category Nodes
    const categoryNodes: Record<string, Node> = {};
    allCategories.forEach(cat => {
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
      initialNodes.push(catNode);
    });

    // 3. Item Nodes
    items.forEach(item => {
      const itemCategories = item.Activity?.split(',').map(c => c.trim()).filter(c => allCategories.includes(c));
      const parentCategory = itemCategories.length > 0 ? itemCategories[0] : 'Other';
      const categoryNode = categoryNodes[parentCategory];

      if (categoryNode) {
        initialNodes.push({
          id: item.id,
          x: categoryNode.x + (Math.random() - 0.5) * 50,
          y: categoryNode.y + (Math.random() - 0.5) * 50,
          vx: 0, vy: 0,
          radius: 6,
          label: item.title,
          type: 'item',
          attractor: { x: categoryNode.x, y: categoryNode.y },
          color: getNodeColor(resolvedTheme, 'item'),
          href: item.pdfUrl || '#',
        });
      }
    });
    
    setNodes(initialNodes);
    setSimulationNodes(initialNodes);

    // Auto-frame on load
    const timeout = setTimeout(() => {
        panZoomRef.current?.zoomTo(0, 0, 0.5, false); // Zoom out a bit to see the whole graph
    }, 500);

    return () => clearTimeout(timeout);

  }, [items, allCategories, resolvedTheme, setSimulationNodes]);

  const onNodeClick = useCallback((node: Node) => {
    if (node.href) {
      window.open(node.href, '_blank');
    }
  }, []);

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
