

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { type Brand, type Category, type NetworkMember } from '@/lib/sheets';
import { VideoBackground } from './video-background';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';
import { Instagram, ArrowLeft, ArrowRight, Share2, User } from 'lucide-react';
import { DotButton } from './ui/carousel'; // Assurez-vous d'importer ce composant s'il existe

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
  actors: string[];
}

const NodalGraph: React.FC<{ members: NetworkMember[] }> = ({ members }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
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
        proximity: 1,
        actors: (samuel.Actors || '').split(',').map(a => a.trim()).filter(Boolean),
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
        proximity: parseInt(member.Proximity, 10),
        actors: (member.Actors || '').split(',').map(a => a.trim()).filter(Boolean),
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
    
    // Group nodes by actor
    const actorsMap: { [key: string]: Node[] } = {};
    nodes.forEach(node => {
        (node.actors || []).forEach(actor => {
            if (!actorsMap[actor]) {
                actorsMap[actor] = [];
            }
            actorsMap[actor].push(node);
        });
    });


    const render = () => {
      context.clearRect(0, 0, width, height);
      const center = { x: width / 2, y: height / 2 };
      
      const foregroundColor = resolvedTheme === 'dark' ? '#FFFFFF' : '#000000';
      const mutedColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
      const strongMutedColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';


      // --- Draw links ---
      const centerNode = nodes.find(n => n.proximity === 1);
      if (centerNode) {
          nodes.forEach(node => {
              if (node.proximity > 1) { // Links from center to others
                  context.beginPath();
                  context.moveTo(center.x + centerNode.x, center.y + centerNode.y);
                  context.lineTo(center.x + node.x, center.y + node.y);
                  context.strokeStyle = strongMutedColor;
                  context.lineWidth = 1; // Thicker line for direct connections
                  context.stroke();
              }
          });
      }
      
      // Draw links for common actors
      context.setLineDash([2, 4]); // Dashed line for secondary connections
      context.lineWidth = 0.5;
      context.strokeStyle = mutedColor;
      Object.values(actorsMap).forEach(group => {
          if (group.length > 1) {
              for (let i = 0; i < group.length; i++) {
                  for (let j = i + 1; j < group.length; j++) {
                      context.beginPath();
                      context.moveTo(center.x + group[i].x, center.y + group[i].y);
                      context.lineTo(center.x + group[j].x, center.y + group[j].y);
                      context.stroke();
                  }
              }
          }
      });
      context.setLineDash([]); // Reset line dash


      // --- Draw nodes ---
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const finalRadius = isHovered ? node.radius * 1.2 : node.radius;

        context.beginPath();
        context.arc(center.x + node.x, center.y + node.y, finalRadius, 0, 2 * Math.PI);
        
        // Don't fill if there is an image to draw
        if (!node.img) {
            context.fillStyle = resolvedTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
            context.fill();
        }

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
        } else {
          // Fallback to an icon if no image
          context.fillStyle = foregroundColor;
          context.font = `${finalRadius}px "Kode Mono", monospace`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText('👤', center.x + node.x, center.y + node.y);
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

const HorizontalCarousel = ({ children }: { children: React.ReactNode }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const isMobile = useIsMobile();

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleWheel = (event: React.WheelEvent) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        if (event.deltaY > 50) {
            emblaApi?.scrollNext();
        } else if (event.deltaY < -50) {
            emblaApi?.scrollPrev();
        }
    }
  };

  return (
    <div className="relative h-screen w-screen">
      <div className="overflow-hidden h-full" ref={emblaRef} onWheel={handleWheel}>
        <div className="flex h-full">
          {React.Children.map(children, (child, index) => (
            <div className="relative h-full w-full flex-shrink-0" key={index}>
              {child}
            </div>
          ))}
        </div>
      </div>
      
      {!isMobile && (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm z-20"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
            >
                <ArrowLeft />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm z-20"
                onClick={scrollNext}
                disabled={!canScrollNext}
            >
                <ArrowRight />
            </Button>
        </>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {React.Children.map(children, (_, index) => (
          <DotButton
            key={index}
            selected={index === selectedIndex}
            onClick={() => scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};


export function HomePageClient({ category, brand, network }: HomePageClientProps) {
  const brandName = brand?.Brand || 'CYBER CLUB';
  const isMobile = useIsMobile();
  const [mobileNetworkView, setMobileNetworkView] = useState<'architect' | 'graph'>('architect');

  useEffect(() => {
    if (window.location.pathname === '/home') {
      document.documentElement.classList.add('graph-view-active');
    }
    return () => {
      document.documentElement.classList.remove('graph-view-active');
    }
  }, []);
  
  const samuel = network.find(m => m.Name === 'Samuel Belaisch');

  const renderNetworkSection = () => {
    if (isMobile) {
      if (!samuel) return null;
      
      if (mobileNetworkView === 'graph') {
        return (
          <section className="w-full h-full relative bg-background">
             <NodalGraph members={network} />
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 left-4 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm z-20"
                onClick={() => setMobileNetworkView('architect')}
             >
                <ArrowLeft />
             </Button>
          </section>
        )
      }

      return (
        <section className="w-full h-full relative flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          {samuel.profilePictureUrl && (
            <Image
              src={samuel.profilePictureUrl}
              alt="Background"
              fill
              className="object-cover object-top"
              quality={100}
            />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full text-center p-4">
              <div className="flex flex-col items-center justify-start pt-16">
                  <h2 className="text-xl font-headline font-light tracking-widest uppercase text-muted-foreground mb-4">The Architect</h2>
                  <h3 className="font-headline text-4xl font-bold">{samuel.Name}</h3>
                  <p className="text-muted-foreground mt-1 text-lg">{samuel.Role}</p>
              </div>
              
              <div className="flex-grow flex flex-col items-center justify-end pb-16">
                  {samuel.Bio && <p className="max-w-md text-sm text-foreground/80 mb-8">{samuel.Bio}</p>}
                  {samuel.Contact && (
                      <Button asChild size="lg" variant="outline" className="bg-background/50 backdrop-blur-sm border-foreground/30">
                          <Link href="https://www.instagram.com/_le_musa/" target="_blank" rel="noopener noreferrer">
                              <Instagram className="mr-2 h-4 w-4" />
                              Contact
                          </Link>
                      </Button>
                  )}
              </div>
          </div>
          
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm z-20"
             onClick={() => setMobileNetworkView('graph')}
            >
              <Share2 />
              <span className="sr-only">Voir le réseau</span>
            </Button>
        </section>
      );
    }

    return (
      <section className="w-full h-full py-12 md:py-24 lg:py-32 bg-background border-y flex items-center justify-center">
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
    );
  };


  return (
    <HorizontalCarousel>
      {/* Section 1: Hero with Video Background */}
      <div className="h-full w-full flex flex-col justify-center items-center text-center p-4">
        {category.Background && <VideoBackground src={category.Background} />}
        <div className="relative z-10 bg-background/20 backdrop-blur-sm p-8 rounded-lg">
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
            <span className="block text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground tracking-widest">Welcome to</span>
            <span className="capitalize">{brandName}</span>
          </h1>
        </div>
      </div>

      {/* Section 2: Network / Architect Section */}
      <div className="h-full w-full">
         {renderNetworkSection()}
      </div>


      {/* Section 3: Blank Content Section */}
      <section className="w-full h-full py-12 md:py-24 lg:py-32 bg-background flex items-center justify-center">
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
    </HorizontalCarousel>
  );
}
