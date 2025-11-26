
'use client';

import React, { memo, useCallback } from 'react';
import type { Node } from './use-simulation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface NodalGraphNodeProps {
  node: Node;
  isHovered: boolean;
  isLocked: boolean;
  onClick: (node: Node) => void;
  onHover: (id: string | null) => void;
}

const NodalGraphNodeComponent: React.FC<NodalGraphNodeProps> = ({ node, isHovered, isLocked, onClick, onHover }) => {
  const { x, y, radius, label, type, color, href, logoUrl } = node;

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
  const isCenter = type === 'center';
  const isCategory = type === 'category';

  const labelYOffset = radius + 8; // Adjust distance of label from node
  const labelWidth = isCenter ? 120 : 100;
  const labelHeight = 28;

  const scale = isHovered ? 1.2 : 1;
  const logoSize = radius * 1.2;

  return (
    <g 
      transform={`translate(${x}, ${y}) scale(${scale})`} 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('transition-all duration-300 group', isClickable ? 'cursor-pointer' : 'cursor-default')}
    >
      {/* Glow Effect for Locked Node */}
      <defs>
          <filter id={`glow-${node.id}`}>
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
              </feMerge>
          </filter>
      </defs>
      {isLocked && (
        <circle
          r={radius + 5}
          fill={color}
          className="opacity-70"
          style={{ filter: `url(#glow-${node.id})` }}
        />
      )}

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

      {/* Logo inside node */}
      {logoUrl && (isCenter || isCategory) && (
        <foreignObject
          x={-logoSize / 2}
          y={-logoSize / 2}
          width={logoSize}
          height={logoSize}
          style={{ pointerEvents: 'none' }}
        >
            <Image
                src={logoUrl}
                alt={`${label} logo`}
                width={logoSize}
                height={logoSize}
                className="rounded-full object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
            />
        </foreignObject>
      )}
      
      {/* Label Elements */}
      {!isItem && (
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
              color: color,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 8px',
              borderRadius: '8px',
              textAlign: 'center',
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: isCenter ? '14px' : '10px',
              fontFamily: isCenter ? 'Orbitron, sans-serif' : 'Kode Mono, monospace',
              fontWeight: isCenter ? 'bold' : 'normal',
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}

       {isItem && (
        <foreignObject 
          x={-80 / 2} 
          y={radius + 4} 
          width={80} 
          height={24}
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
      )}
    </g>
  );
};

export const NodalGraphNode = memo(NodalGraphNodeComponent);
