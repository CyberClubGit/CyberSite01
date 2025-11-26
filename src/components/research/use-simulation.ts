
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  type: 'center' | 'category' | 'item';
  attractor: { x: number; y: number };
  parentAttractor: { x: number; y: number } | null;
  color: string;
  href?: string;
  logoUrl?: string | null;
}

interface SimulationOptions {
  attractionStiffness?: number;
  repulsionStiffness?: number;
  damping?: number;
}

export const useSimulation = (options: SimulationOptions = {}) => {
  const {
    attractionStiffness = 0.005,
    repulsionStiffness = 150,
    damping = 0.95,
  } = options;

  const nodesRef = useRef<Node[]>([]);
  const [, setTick] = useState(0);
  const animationFrameRef = useRef<number>();

  const runSimulation = useCallback(() => {
    if (nodesRef.current.length === 0) {
      animationFrameRef.current = requestAnimationFrame(runSimulation);
      return;
    }

    const currentNodes = nodesRef.current;
    
    for (let i = 0; i < currentNodes.length; i++) {
      const nodeA = currentNodes[i];

      // 1. Attraction Force to attractor
      const dxAttractor = nodeA.attractor.x - nodeA.x;
      const dyAttractor = nodeA.attractor.y - nodeA.y;
      nodeA.vx += dxAttractor * attractionStiffness;
      nodeA.vy += dyAttractor * attractionStiffness;

      // 2. Repulsion Force from other nodes
      for (let j = 0; j < currentNodes.length; j++) {
        if (i === j) continue;
        const nodeB = currentNodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        distance = Math.max(1, distance);

        const minDistance = nodeA.radius + nodeB.radius;

        if (distance < minDistance) {
            const overlap = minDistance - distance;
            const pushFactor = overlap * 0.05;
            nodeA.vx += (dx / distance) * pushFactor;
            nodeA.vy += (dy / distance) * pushFactor;
        }
        
        const force = (repulsionStiffness / (distance * distance));
        nodeA.vx += (dx / distance) * force;
        nodeA.vy += (dy / distance) * force;
      }
    }

    // 3. Update positions and apply damping
    for (const node of currentNodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
    }

    animationFrameRef.current = requestAnimationFrame(runSimulation);
  }, [attractionStiffness, repulsionStiffness, damping]);
  
  const setNodes = useCallback((newNodes: Node[]) => {
      nodesRef.current = newNodes;
      setTick(t => t + 1); // Force a re-render to show initial state
  }, []);

  const forceUpdate = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(runSimulation);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [runSimulation]);

  return { simulatedNodes: nodesRef.current, setNodes, forceUpdate };
};
