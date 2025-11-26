
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
  const [, setTick] = useState(0); // Used to force re-render
  const animationFrameRef = useRef<number>();

  const runSimulation = useCallback(() => {
    if (nodesRef.current.length === 0) {
      animationFrameRef.current = requestAnimationFrame(runSimulation);
      return;
    }

    const currentNodes = nodesRef.current;
    let changed = false;

    for (let i = 0; i < currentNodes.length; i++) {
      const nodeA = currentNodes[i];

      // Attraction Force to attractor
      const dxAttractor = nodeA.attractor.x - nodeA.x;
      const dyAttractor = nodeA.attractor.y - nodeA.y;
      nodeA.vx += dxAttractor * attractionStiffness;
      nodeA.vy += dyAttractor * attractionStiffness;

      // Repulsion Force from other nodes
      for (let j = i + 1; j < currentNodes.length; j++) {
        const nodeB = currentNodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        distance = Math.max(1, distance);

        const force = (repulsionStiffness / (distance * distance));
        const repulsionForceX = (dx / distance) * force;
        const repulsionForceY = (dy / distance) * force;
        
        nodeA.vx += repulsionForceX;
        nodeA.vy += repulsionForceY;
        nodeB.vx -= repulsionForceX;
        nodeB.vy -= repulsionForceY;

        // Collision avoidance
        const minDistance = nodeA.radius + nodeB.radius;
        if (distance < minDistance) {
            const overlap = minDistance - distance;
            const pushFactor = overlap * 0.1; 
            const pushX = (dx / distance) * pushFactor;
            const pushY = (dy / distance) * pushFactor;
            nodeA.vx += pushX;
            nodeA.vy += pushY;
            nodeB.vx -= pushX;
            nodeB.vy -= pushY;
        }
      }
    }

    // Update positions and apply damping
    for (const node of currentNodes) {
      if (Math.abs(node.vx) > 0.01 || Math.abs(node.vy) > 0.01) {
        changed = true;
      }
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
    }

    if(changed) {
        forceUpdate(); // Force re-render if nodes moved
    }
    animationFrameRef.current = requestAnimationFrame(runSimulation);
  }, [attractionStiffness, repulsionStiffness, damping]);
  
  const setNodes = useCallback((newNodes: Node[]) => {
      nodesRef.current = newNodes;
      forceUpdate();
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
