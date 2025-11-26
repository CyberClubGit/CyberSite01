
'use client';

import { type Brand, type Category, type NetworkMember } from '@/lib/sheets';
import { VideoBackground } from './video-background';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

// NodalGraph component to be included in this file
interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  img?: string;
  proximity: number;
}

const NodalGraph: React.FC<{ members: NetworkMember[] }> = ({ members }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  useEffect(() => {
    const samuel = members.find(m => m.Name === 'Samuel Belaisch');
    const otherMembers = members.filter(m => m.Name !== 'Samuel Belaisch');

    const initialNodes: Node[] = [];
    if (samuel) {
      initialNodes.push({
        id: samuel.Name,
        x: 0, y: 0, vx: 0, vy: 0,
        radius: 40,
        label: samuel.Name,
        img: samuel.profilePictureUrl,
        proximity: 1
      });
    }

    otherMembers.forEach(member => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 100 + (parseInt(member.Proximity, 10) - 2) * 80;
      initialNodes.push({
        id: member.Name,
        x: distance * Math.cos(angle),
        y: distance * Math.sin(angle),
        vx: 0, vy: 0,
        radius: 20,
        label: member.Name,
        img: member.profilePictureUrl,
        proximity: parseInt(member.Proximity, 10)
      });
    });
    setNodes(initialNodes);
  }, [members]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    let animationFrameId: number;

    const render = () => {
      context.clearRect(0, 0, width, height);
      const center = { x: width / 2, y: height / 2 };
      
      const foregroundColor = resolvedTheme === 'dark' ? '#FFFFFF' : '#000000';
      const mutedColor = resolvedTheme === 'dark' ? '#888888' : '#888888';

      // --- Draw links ---
      nodes.forEach(node => {
        if (node.proximity > 1) { // Don't draw link for center node
            const centerNode = nodes[0];
            context.beginPath();
            context.moveTo(center.x + centerNode.x, center.y + centerNode.y);
            context.lineTo(center.x + node.x, center.y + node.y);
            context.strokeStyle = mutedColor;
            context.lineWidth = 0.5;
            context.stroke();
        }
      });


      // --- Draw nodes ---
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const finalRadius = isHovered ? node.radius * 1.2 : node.radius;

        context.beginPath();
        context.arc(center.x + node.x, center.y + node.y, finalRadius, 0, 2 * Math.PI);
        context.fillStyle = resolvedTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
        context.fill();
        context.strokeStyle = foregroundColor;
        context.lineWidth = 2;
        context.stroke();

        // --- Draw image ---
        if (node.img) {
            const img = new (window as any).Image();
            img.src = node.img;
            context.save();
            context.beginPath();
            context.arc(center.x + node.x, center.y + node.y, finalRadius, 0, Math.PI * 2, true);
            context.clip();
            try {
              context.drawImage(img, center.x + node.x - finalRadius, center.y + node.y - finalRadius, finalRadius * 2, finalRadius * 2);
            } catch(e) {
              // image might not be loaded yet
            }
            context.restore();
        }
        
        // --- Draw label ---
        if (isHovered) {
          context.fillStyle = foregroundColor;
          context.font = '12px "Kode Mono", monospace';
          context.textAlign = 'center';
          context.fillText(node.label, center.x + node.x, center.y + node.y + finalRadius + 15);
        }
      });

      // Update node positions
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => {
            // Attraction to center or proximity ring
            const target = {x: 0, y: 0};
            let attractionForce = 0.001;

            if (node.proximity > 1) {
                const distanceToCenter = Math.sqrt(node.x*node.x + node.y*node.y);
                const targetRadius = 100 + (node.proximity - 2) * 80;
                
                if (distanceToCenter > 0) {
                    const ringForce = (distanceToCenter - targetRadius) * 0.0005;
                    node.vx -= (node.x / distanceToCenter) * ringForce;
                    node.vy -= (node.y / distanceToCenter) * ringForce;
                }

            } else { // Center node
                node.vx += (target.x - node.x) * attractionForce;
                node.vy += (target.y - node.y) * attractionForce;
            }

            // Repulsion from other nodes
            prevNodes.forEach(otherNode => {
                if (node.id === otherNode.id) return;
                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < (node.radius + otherNode.radius + 20)) { // Add buffer
                    const force = 1 / distance;
                    node.vx += (dx / distance) * force;
                    node.vy += (dy / distance) * force;
                }
            });

            // Apply damping
            node.vx *= 0.95;
            node.vy *= 0.95;

            return { ...node, x: node.x + node.vx, y: node.y + node.vy };
        });
        return newNodes;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left) - width / 2;
      const mouseY = (event.clientY - rect.top) - height / 2;

      let foundNode = null;
      for (const node of nodes) {
        const distance = Math.sqrt(Math.pow(node.x - mouseX, 2) + Math.pow(node.y - mouseY, 2));
        if (distance < node.radius) {
          foundNode = node;
          break;
        }
      }
      setHoveredNode(foundNode);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [nodes, resolvedTheme, hoveredNode]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};


interface HomePageClientProps {
  category: Category;
  brand?: Brand;
  network: NetworkMember[];
}

export function HomePageClient({ category, brand, network }: HomePageClientProps) {
  const brandName = brand?.Brand || 'CYBER CLUB';

  return (
    <>
      {/* Section 1: Hero with Video Background */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center p-4">
        {category.Background && <VideoBackground src={category.Background} />}
        <div className="relative z-10 bg-background/20 backdrop-blur-sm p-8 rounded-lg">
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
            <span className="block text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground tracking-widest">Welcome to</span>
            <span className="capitalize">{brandName}</span>
          </h1>
        </div>
      </div>

      {/* Section 2: Network Graph */}
      <section className="w-full h-screen py-12 md:py-24 lg:py-32 bg-background border-y">
        <div className="container h-full px-4 md:px-6 flex flex-col">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Network</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Notre écosystème de créateurs, chercheurs et collaborateurs.
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
             <NodalGraph members={network} />
          </div>
        </div>
      </section>

      {/* Section 3: Blank Content Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Contenu à venir</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Cette section est prête à accueillir de nouveaux modules, composants ou informations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
