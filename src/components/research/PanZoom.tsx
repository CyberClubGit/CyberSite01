
'use client';

import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  ReactNode,
  WheelEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { cn } from '@/lib/utils';

export interface PanZoomApi {
  zoomTo: (x: number, y: number, zoom: number, animate?: boolean) => void;
}

interface PanZoomProps {
  children: ReactNode;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

export const PanZoom = forwardRef<PanZoomApi, PanZoomProps>(({
  children,
  minZoom = 0.1,
  maxZoom = 5,
  className,
}, ref) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<SVGSVGElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    zoomTo: (x, y, newZoom, animate = true) => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const centerX = parent.clientWidth / 2;
      const centerY = parent.clientHeight / 2;

      setTransform({
        x: centerX - x * newZoom,
        y: centerY - y * newZoom,
        zoom: newZoom,
      });
    },
  }));

  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1 - e.deltaY * 0.001;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, transform.zoom * zoomFactor));

    const newX = mouseX - (mouseX - transform.x) * (newZoom / transform.zoom);
    const newY = mouseY - (mouseY - transform.y) * (newZoom / transform.zoom);

    setTransform({ x: newX, y: newY, zoom: newZoom });
  }, [transform, minZoom, maxZoom]);

  const onMouseDown = useCallback((e: ReactMouseEvent<SVGSVGElement> | TouchEvent) => {
    e.preventDefault();
    setIsPanning(true);
    const point = 'touches' in e ? e.touches[0] : e;
    lastPointRef.current = { x: point.clientX, y: point.clientY };
    if (e.currentTarget instanceof Element) {
      e.currentTarget.classList.add('cursor-grabbing');
    }
  }, []);

  const onMouseUp = useCallback((e: ReactMouseEvent<SVGSVGElement> | MouseEvent | TouchEvent) => {
    setIsPanning(false);
    lastPointRef.current = null;
    if (e.currentTarget instanceof Element) {
      e.currentTarget.classList.remove('cursor-grabbing');
    }
  }, []);

  const onMouseMove = useCallback((e: ReactMouseEvent<SVGSVGElement> | MouseEvent | TouchEvent) => {
    if (!isPanning || !lastPointRef.current) return;
    
    const point = 'touches' in e ? e.touches[0] : e;
    const dx = point.clientX - lastPointRef.current.x;
    const dy = point.clientY - lastPointRef.current.y;

    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    lastPointRef.current = { x: point.clientX, y: point.clientY };
  }, [isPanning]);

  // Add global event listeners to handle mouse up/move outside the SVG
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);
      };
    }
  }, [isPanning, onMouseMove, onMouseUp]);

  return (
    <svg
      ref={containerRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      className={cn('w-full h-full cursor-grab', className)}
    >
      <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})` }}>
        {children}
      </g>
    </svg>
  );
});

PanZoom.displayName = 'PanZoom';
