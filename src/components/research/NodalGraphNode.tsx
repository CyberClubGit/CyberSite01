
'use client';

import React, { memo, useCallback } from 'react';
import type { Node } from './use-simulation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface NodalGraphNodeProps {
  node: Node;
  isHovered: boolean;
  isLocked: boolean;
  isEmphasized: boolean; // For item nodes when their category is locked
  isAnotherNodeLocked: boolean; // True if a different node is locked
  onClick: (node: Node) => void;
  onHover: (id: string | null) => void;
}

const ITEM_RADIUS_FOR_GLOW = 60; // Should match itemRadius in NodalGraphView

const NodalGraphNodeComponent: React.FC<NodalGraphNodeProps> = ({ node, isHovered, isLocked, isEmphasized, isAnotherNodeLocked, onClick, onHover }) => {
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
  let labelWidth = 100;
  let labelHeight = 28;
  let textAlign: 'center' | 'left' | 'right' = 'center';
  let labelFontSize = '12px';
  let labelIsVisible = true;

  const glowRadius = radius + ITEM_RADIUS_FOR_GLOW + 20;

  if (isCenter) {
    labelWidth = 120;
    labelXOffset = -labelWidth / 2;
    labelFontSize = '14px';
    // Center label is always visible and below the node
  } else if (isCategory) {
    if (isLocked) {
      // **CATEGORY LOCKED VIEW**
      labelWidth = 200;
      labelHeight = 40;
      labelXOffset = -labelWidth / 2;
      labelYOffset = -glowRadius - labelHeight - 10; // Position above the glow
      textAlign = 'center';
      labelFontSize = '24px';
    } else if (isAnotherNodeLocked) {
      // **ANOTHER CATEGORY IS LOCKED VIEW**
      labelIsVisible = false; // Hide label if another category is locked
    } else {
      // **GENERAL OVERVIEW**
      const deltaX = x; // position relative to (0,0) center
      const deltaY = y;
      labelWidth = 150;
      labelHeight = 32;
      labelFontSize = '64px'; // Increased font size for overview
      
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) { // More horizontal
        textAlign = deltaX > 0 ? 'left' : 'right';
        labelXOffset = deltaX > 0 ? glowRadius + 10 : -glowRadius - 10 - labelWidth;
        labelYOffset = -labelHeight / 2;
      } else { // More vertical
        textAlign = 'center';
        labelYOffset = deltaY > 0 ? glowRadius + 10 : -glowRadius - 10 - labelHeight;
        labelXOffset = -labelWidth / 2;
      }
    }
  } else if (isItem) {
      labelIsVisible = isEmphasized;
      if (isEmphasized && parentAttractor) {
          const deltaX = x - parentAttractor.x;
          const deltaY = y - parentAttractor.y;
          labelWidth = 80;
          labelHeight = 24;
          labelFontSize = '10px';

          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontally dominant
            textAlign = deltaX > 0 ? 'left' : 'right';
            labelXOffset = deltaX > 0 ? radius + 8 : -radius - 8 - labelWidth;
            labelYOffset = -labelHeight / 2;
          } else {
            // Vertically dominant
            textAlign = 'center';
            labelXOffset = -labelWidth / 2;
            labelYOffset = deltaY > 0 ? radius + 8 : -radius - 8 - labelHeight;
          }
      } else { // Default item view (not emphasized)
        labelIsVisible = false;
      }
  }
  // --- End Label Positioning ---

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
      {labelIsVisible && (
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
              backgroundColor: isCategory ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
              padding: isItem ? '2px 4px' : (isCategory ? '0' : '4px 8px'),
              borderRadius: isItem ? '4px' : '8px',
              textAlign: textAlign,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: labelFontSize,
              fontFamily: (isCenter || isCategory) ? 'Orbitron, sans-serif' : 'Kode Mono, monospace',
              fontWeight: (isCenter || isCategory) ? 'bold' : 'normal',
              textTransform: isCategory ? 'uppercase' : 'none',
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
