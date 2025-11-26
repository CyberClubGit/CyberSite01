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
  color: string;
  href?: string;
}

interface SimulationOptions {
  attractionStiffness?: number;
  repulsionStiffness?: number;
  damping?: number;
}

export const useSimulation = (options: SimulationOptions = {}) => {
  const {
    attractionStiffness = 0.01,
    repulsionStiffness = 400,
    damping = 0.9,
  } = options;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [simulatedNodes, setSimulatedNodes] = useState<Node[]>([]);
  const animationFrameRef = useRef<number>();

  const runSimulation = useCallback(() => {
    setNodes(currentNodes => {
      if (currentNodes.length === 0) return [];

      const newNodes = currentNodes.map(node => ({ ...node }));

      for (let i = 0; i < newNodes.length; i++) {
        const nodeA = newNodes[i];

        // 1. Attraction Force to attractor
        const dxAttractor = nodeA.attractor.x - nodeA.x;
        const dyAttractor = nodeA.attractor.y - nodeA.y;
        nodeA.vx += dxAttractor * attractionStiffness;
        nodeA.vy += dyAttractor * attractionStiffness;

        // 2. Repulsion Force from other nodes
        for (let j = 0; j < newNodes.length; j++) {
          if (i === j) continue;
          const nodeB = newNodes[j];
          
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          distance = Math.max(1, distance); // Avoid division by zero

          const force = (repulsionStiffness / (distance * distance));
          const minDistance = nodeA.radius + nodeB.radius;

          if (distance < minDistance) {
              const overlap = minDistance - distance;
              const pushFactor = overlap * 0.1; 
              nodeA.vx += (dx / distance) * pushFactor;
              nodeA.vy += (dy / distance) * pushFactor;
          }

          nodeA.vx += (dx / distance) * force;
          nodeA.vy += (dy / distance) * force;
        }
      }

      // 3. Update positions and apply damping
      for (const node of newNodes) {
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      }
      
      setSimulatedNodes(newNodes);
      return newNodes;
    });

    animationFrameRef.current = requestAnimationFrame(runSimulation);
  }, [attractionStiffness, repulsionStiffness, damping]);

  useEffect(() => {
    if (nodes.length > 0) {
      animationFrameRef.current = requestAnimationFrame(runSimulation);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes, runSimulation]);

  return { simulatedNodes, setNodes };
};
