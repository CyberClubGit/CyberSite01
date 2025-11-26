
'use client';

import React, { memo, useMemo } from 'react';
import type { Node } from './use-simulation';
import { cn } from '@/lib/utils';

interface NodalGraphNodeProps {
  node: Node;
  onClick: (node: Node) => void;
}

const NodalGraphNodeComponent: React.FC<NodalGraphNodeProps> = ({ node, onClick }) => {
  const { x, y, radius, label, type, color, href } = node;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(node);
  };

  const isClickable = !!href;

  const commonProps = {
    onClick: handleClick,
    className: cn('transition-all duration-300', isClickable ? 'cursor-pointer' : 'cursor-default'),
  };

  const textFontSize = useMemo(() => {
    if (type === 'center') return '16px';
    if (type === 'category') return '12px';
    return '9px';
  }, [type]);

  return (
    <g transform={`translate(${x}, ${y})`} {...commonProps}>
      <circle
        r={radius}
        fill={color}
        fillOpacity={0.5}
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
        className="opacity-50 animate-pulse"
      />
      <text
        textAnchor="middle"
        dy=".3em"
        fill={color}
        fontSize={textFontSize}
        className="font-mono pointer-events-none select-none opacity-80"
      >
        {label}
      </text>
    </g>
  );
};

export const NodalGraphNode = memo(NodalGraphNodeComponent);
