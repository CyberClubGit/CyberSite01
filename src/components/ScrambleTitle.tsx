
'use client';

import { useTextScramble } from '@/hooks/useTextScramble';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ScrambleTitleProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function ScrambleTitle({ 
  text, 
  className,
  as: Component = 'h1' 
}: ScrambleTitleProps) {
  // Delay starting the animation slightly to ensure the component is mounted and visible
  const [start, setStart] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { displayText, isTyping } = useTextScramble(text, start);

  return (
    <Component className={cn('font-mono', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText}
        {isTyping && (
          <span className="inline-block animate-blink ml-1">_</span>
        )}
      </span>
    </Component>
  );
}
