
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
  useEffect,
} from 'react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

export interface PanZoomState {
  x: number;
  y: number;
  zoom: number;
}

export interface PanZoomApi {
  zoomTo: (x: number, y: number, zoom: number, animate?: boolean) => void;
  getState: () => PanZoomState;
}

interface PanZoomProps {
  children: ReactNode;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  onZoomRequest?: (deltaY: number, mouseX: number, mouseY: number) => void;
  onTransformChange?: (state: PanZoomState) => void;
}

const PanZoomComponent = forwardRef<PanZoomApi, PanZoomProps>(({
  children,
  minZoom = 0.1,
  maxZoom = 5,
  className,
  onZoomRequest,
  onTransformChange,
}, ref) => {
  const transformRef = useRef<PanZoomState>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isAnimatingRef = useRef(false);

  const debouncedOnTransformChange = useDebouncedCallback((state: PanZoomState) => {
    onTransformChange?.(state);
  }, 50);

  const updateTransform = (newTransform: PanZoomState, animate: boolean = false) => {
    transformRef.current = newTransform;
    if (contentRef.current) {
        contentRef.current.style.transition = animate ? 'transform 700ms cubic-bezier(0.25, 1, 0.5, 1)' : '';
        contentRef.current.style.transform = `translate(${newTransform.x}px, ${newTransform.y}px) scale(${newTransform.zoom})`;
    }
    debouncedOnTransformChange(newTransform);
  };
  
  useImperativeHandle(ref, () => ({
    zoomTo: (x, y, newZoom, animate = true) => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
      const centerX = parent.clientWidth / 2;
      const centerY = parent.clientHeight / 2;
      const newX = centerX - x * clampedZoom;
      const newY = centerY - y * clampedZoom;
      
      isAnimatingRef.current = animate;
      updateTransform({ x: newX, y: newY, zoom: clampedZoom }, animate);

      if (animate) {
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 700);
      }
    },
    getState: () => transformRef.current,
  }));
  
  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        if(contentRef.current) contentRef.current.style.transition = '';
    };

    const rect = e.currentTarget.getBoundingClientRect();
    const currentTransform = transformRef.current;
    
    if (onZoomRequest) {
      const mouseX = (e.clientX - rect.left - currentTransform.x) / currentTransform.zoom;
      const mouseY = (e.clientY - rect.top - currentTransform.y) / currentTransform.zoom;
      onZoomRequest(e.deltaY, mouseX, mouseY);
    } else {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = 1 - e.deltaY * 0.001;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, currentTransform.zoom * zoomFactor));

      const newX = mouseX - (mouseX - currentTransform.x) * (newZoom / currentTransform.zoom);
      const newY = mouseY - (mouseY - currentTransform.y) * (newZoom / currentTransform.zoom);

      updateTransform({ x: newX, y: newY, zoom: newZoom });
    }
  }, [minZoom, maxZoom, onZoomRequest]);


  const onMouseDown = useCallback((e: ReactMouseEvent<SVGSVGElement> | TouchEvent) => {
    e.preventDefault();
    if (isAnimatingRef.current) {
      isAnimatingRef.current = false;
      if (contentRef.current) contentRef.current.style.transition = '';
    }

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
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
    }
  }, []);

  const onMouseMove = useCallback((e: ReactMouseEvent<SVGSVGElement> | MouseEvent | TouchEvent) => {
    if (!isPanning || !lastPointRef.current) return;
    
    const point = 'touches' in e ? e.touches[0] : e;
    const dx = point.clientX - lastPointRef.current.x;
    const dy = point.clientY - lastPointRef.current.y;
    
    const currentTransform = transformRef.current;
    updateTransform({ ...currentTransform, x: currentTransform.x + dx, y: currentTransform.y + dy });
    
    lastPointRef.current = { x: point.clientX, y: point.clientY };
  }, [isPanning]);


  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => onMouseMove(e);
    const handleUp = (e: MouseEvent | TouchEvent) => onMouseUp(e);

    if (isPanning) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
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
      <g 
        ref={contentRef}
        style={{ transform: `translate(${transformRef.current.x}px, ${transformRef.current.y}px) scale(${transformRef.current.zoom})` }}
      >
        {children}
      </g>
    </svg>
  );
});

PanZoomComponent.displayName = 'PanZoom';

export const PanZoom = PanZoomComponent;
