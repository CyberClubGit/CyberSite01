
'use client';

import React, { memo, useCallback } from 'react';
import type { Node } from './use-simulation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface NodalGraphNodeProps {
  node: Node;
  isHovered: boolean;
  isLocked: boolean;
  isEmphasized: boolean; // New prop to indicate if the item node should be enlarged
  onClick: (node: Node) => void;
  onHover: (id: string | null) => void;
}

const ITEM_RADIUS_FOR_GLOW = 60; // Should match itemRadius in NodalGraphView

const NodalGraphNodeComponent: React.FC<NodalGraphNodeProps> = ({ node, isHovered, isLocked, isEmphasized, onClick, onHover }) => {
  const { x, y, label, type, color, href, logoUrl, parentAttractor } = node;
  let { radius } = node;

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

  if (isItem && isEmphasized) {
    radius *= 3;
  }

  // --- Label Positioning ---
  let labelXOffset = -50;
  let labelYOffset = radius + 8;
  let labelWidth = isCenter ? 120 : 100;
  let labelHeight = 28;
  let textAlign: 'center' | 'left' | 'right' = 'center';

  if (isItem && isEmphasized && parentAttractor) {
    labelWidth = 80;
    labelHeight = 24;
    textAlign = 'left';
    // Position label to the side of the node
    const isRightOfParent = x > parentAttractor.x;
    if (isRightOfParent) {
      labelXOffset = -labelWidth - 8; // To the left
    } else {
      labelXOffset = radius + 8; // To the right
    }
    labelYOffset = -labelHeight / 2; // Centered vertically
  } else if (isItem) {
    labelWidth = 80;
    labelHeight = 24;
    labelXOffset = -labelWidth / 2;
    labelYOffset = radius + 4;
  } else { // Center or Category
    labelXOffset = -labelWidth / 2;
  }
  // --- End Label Positioning ---

  const scale = isHovered ? 1.2 : 1;
  const logoSize = radius * 1.2;

  const glowRadius = radius + ITEM_RADIUS_FOR_GLOW + 20; // Category radius + item orbit radius + padding

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
          <filter id={`glow-filter-${node.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="15" result="coloredBlur" />
              <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
              </feMerge>
          </filter>
      </defs>

      {isLocked && (isCategory || isCenter) && (
        <circle
          r={glowRadius}
          fill={color}
          className="opacity-20 transition-opacity duration-500"
          style={{ filter: `url(#glow-filter-${node.id})`, pointerEvents: 'none' }}
        />
      )}


      {/* Circle Elements */}
      <circle
        r={radius}
        fill={color}
        fillOpacity={isItem ? 0.8 : 0.5}
        stroke={color}
        strokeWidth="1"
        className="group-hover:opacity-80 transition-all duration-300"
      />
      <circle
        r={radius + 3}
        fill="transparent"
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="2 2"
        className="opacity-50 animate-pulse group-hover:opacity-0 transition-all duration-300"
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
      <foreignObject 
        x={labelXOffset} 
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
            padding: isItem ? '2px 4px' : '4px 8px',
            borderRadius: isItem ? '4px' : '8px',
            textAlign: textAlign,
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isCenter ? '14px' : (isItem ? (isEmphasized ? '10px' : '8px') : '10px'),
            fontFamily: isCenter ? 'Orbitron, sans-serif' : 'Kode Mono, monospace',
            fontWeight: isCenter ? 'bold' : 'normal',
          }}
        >
          {label}
        </div>
      </foreignObject>
    </g>
  );
};

export const NodalGraphNode = memo(NodalGraphNodeComponent);
