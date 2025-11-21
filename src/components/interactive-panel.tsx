'use client';

import { useRef, useMemo } from 'react';
import { useMouse } from '@uidotdev/usehooks';
import { cn } from '@/lib/utils';

interface InteractivePanelProps {
  children: React.ReactNode;
  className?: string;
}

export function InteractivePanel({ children, className }: InteractivePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { elementX, elementY, elementWidth, elementHeight } = useMouse(panelRef);

  const styles = useMemo(() => {
    if (elementX === null || elementY === null) {
      return { cardStyle: {}, glowStyle: {} };
    }

    const mouseX = elementX / elementWidth;
    const mouseY = elementY / elementHeight;
    const rotateY = (mouseX - 0.5) * 10;
    const rotateX = -(mouseY - 0.5) * 10;

    const glowX = mouseX * 100;
    const glowY = mouseY * 100;

    return {
      cardStyle: {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      },
      glowStyle: {
        background: `radial-gradient(circle at ${glowX}% ${glowY}%, hsl(var(--primary) / 0.1), transparent 40%)`,
      },
    };
  }, [elementX, elementY, elementWidth, elementHeight]);

  return (
    <div
      ref={panelRef}
      style={styles.cardStyle}
      className={cn(
        "relative w-full h-full bg-muted/20 border border-border/50 rounded-lg p-4 transition-transform duration-100 ease-out will-change-transform",
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100"
        style={styles.glowStyle}
      />
      <div className="relative h-full w-full">
        {children}
      </div>
    </div>
  );
}
