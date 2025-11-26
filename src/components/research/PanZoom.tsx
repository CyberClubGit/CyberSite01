
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
  centerX: number; // world coordinate
  centerY: number; // world coordinate
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
  onTransformChange?: (state: PanZoomState) => void;
  onManualPan?: () => void;
}

const PanZoomComponent = forwardRef<PanZoomApi, PanZoomProps>(({
  children,
  minZoom = 0.1,
  maxZoom = 5,
  className,
  onTransformChange,
  onManualPan,
}, ref) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isAnimatingRef = useRef(false);

  const getCurrentState = useCallback((): PanZoomState => {
    const parent = containerRef.current?.parentElement;
    if (!parent) {
      return { ...transform, centerX: 0, centerY: 0 };
    }
    const { x, y, zoom } = transform;
    const centerX = (parent.clientWidth / 2 - x) / zoom;
    const centerY = (parent.clientHeight / 2 - y) / zoom;
    return { x, y, zoom, centerX, centerY };
  }, [transform]);

  // Debounced callback for transform changes
  const debouncedOnTransformChange = useDebouncedCallback((state: PanZoomState) => {
    onTransformChange?.(state);
  }, 100);
  
  useEffect(() => {
    // We only call the debounced function if not animating to avoid interference
    if (!isAnimatingRef.current) {
        debouncedOnTransformChange(getCurrentState());
    }
  }, [transform, getCurrentState, debouncedOnTransformChange]);

  useImperativeHandle(ref, () => ({
    zoomTo: (x, y, newZoom, animate = true) => {
      const parent = containerRef.current?.parentElement;
      if (!parent || !contentRef.current) return;

      
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

      const centerX = parent.clientWidth / 2;
      const centerY = parent.clientHeight / 2;

      const newX = centerX - x * clampedZoom;
      const newY = centerY - y * clampedZoom;
      
      if (animate) {
        isAnimatingRef.current = true;
        contentRef.current.style.transition = 'transform 700ms cubic-bezier(0.25, 1, 0.5, 1)';
        setTransform({
          x: newX,
          y: newY,
          zoom: clampedZoom,
        });
        setTimeout(() => {
          if (contentRef.current) contentRef.current.style.transition = '';
          isAnimatingRef.current = false;
        }, 700);
      } else {
        setTransform({
          x: newX,
          y: newY,
          zoom: clampedZoom,
        });
        isAnimatingRef.current = false;
      }
    },
    getState: getCurrentState,
  }));

  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        if(contentRef.current) contentRef.current.style.transition = '';
    };
    onManualPan?.();

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1 - e.deltaY * 0.001;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, transform.zoom * zoomFactor));

    const newX = mouseX - (mouseX - transform.x) * (newZoom / transform.zoom);
    const newY = mouseY - (mouseY - transform.y) * (newZoom / transform.zoom);

    setTransform({ x: newX, y: newY, zoom: newZoom });
  }, [transform, minZoom, maxZoom, onManualPan]);

  const onMouseDown = useCallback((e: ReactMouseEvent<SVGSVGElement> | TouchEvent) => {
    e.preventDefault();
    if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        if(contentRef.current) contentRef.current.style.transition = '';
    };
    onManualPan?.();
    
    setIsPanning(true);
    const point = 'touches' in e ? e.touches[0] : e;
    lastPointRef.current = { x: point.clientX, y: point.clientY };
    if (e.currentTarget instanceof Element) {
      e.currentTarget.classList.add('cursor-grabbing');
    }
  }, [onManualPan]);

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
    <>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none">
        <div className="w-full h-px bg-current absolute top-1/2"></div>
        <div className="h-full w-px bg-current absolute left-1/2"></div>
      </div>
      <svg
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
        className={cn('w-full h-full cursor-grab', className)}
      >
        <g 
          ref={contentRef}
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})` }}
        >
          {children}
        </g>
      </svg>
    </>
  );
});

PanZoomComponent.displayName = 'PanZoom';

export const PanZoom = PanZoomComponent;
