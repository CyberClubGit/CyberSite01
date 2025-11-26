
'use client';

import React, { memo, useCallback } from 'react';
import type { Node } from './use-simulation';
import { cn } from '@/lib/utils';

interface NodalGraphNodeProps {
  node: Node;
  isHovered: boolean;
  onClick: (node: Node) => void;
  onHover: (id: string | null) => void;
}

const NodalGraphNodeComponent: React.FC<NodalGraphNodeProps> = ({ node, isHovered, onClick, onHover }) => {
  const { x, y, radius, label, type, color, href } = node;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick(node);
  }, [node, onClick]);

  const handleMouseEnter = useCallback(() => {
    onHover(node.id);
  }, [node.id, onHover]);
  
  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const isClickable = !!href;
  
  const isItem = type === 'item';
  const labelYOffset = radius + 4;
  const labelWidth = 80;
  const labelHeight = 24;

  const scale = isHovered ? 1.5 : 1;

  return (
    <g 
      transform={`translate(${x}, ${y}) scale(${scale})`} 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('transition-all duration-300 group', isClickable ? 'cursor-pointer' : 'cursor-default')}
    >
      {/* Circle Elements */}
      <circle
        r={radius}
        fill={color}
        fillOpacity={isItem ? 0.8 : 0.5}
        stroke={color}
        strokeWidth="1"
        className="group-hover:opacity-80"
      />
      <circle
        r={radius + 3}
        fill="transparent"
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="2 2"
        className="opacity-50 animate-pulse group-hover:opacity-0"
      />
      
      {/* Label Elements */}
      {isItem ? (
        <foreignObject 
          x={-labelWidth / 2} 
          y={labelYOffset} 
          width={labelWidth} 
          height={labelHeight}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div 
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              fontSize: '8px',
              color: color,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '2px 4px',
              borderRadius: '4px',
              textAlign: 'center',
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'monospace',
            }}
          >
            {label}
          </div>
        </foreignObject>
      ) : (
        <text
          textAnchor="middle"
          dy=".3em"
          fill={color}
          fontSize={type === 'center' ? '16px' : '12px'}
          className="font-mono pointer-events-none select-none opacity-80"
        >
          {label}
        </text>
      )}
    </g>
  );
};

export const NodalGraphNode = memo(NodalGraphNodeComponent);
