
'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';

const MAX_ROTATION = 8; // Max rotation in degrees

export function useParallax(elementRef: RefObject<HTMLElement>) {
  const [styles, setStyles] = useState({
    cardStyle: {},
    glowStyle: {},
  });

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setStyles({
        cardStyle: {
          transform: 'rotateX(0deg) rotateY(0deg)',
        },
        glowStyle: {
          backgroundPosition: '50% 50%',
        },
      });
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = element.getBoundingClientRect();

      const x = clientX - left;
      const y = clientY - top;

      const mouseX = (x - width / 2) / (width / 2); // -1 to 1
      const mouseY = (y - height / 2) / (height / 2); // -1 to 1

      const rotateY = mouseX * MAX_ROTATION;
      const rotateX = -mouseY * MAX_ROTATION;
      
      // For the gradient to "follow" the mouse, we update its position
      const glowX = 50 + mouseX * 25; // 25% to 75%
      const glowY = 50 + mouseY * 25; // 25% to 75%

      setStyles({
        cardStyle: {
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        },
        glowStyle: {
          backgroundPosition: `${glowX}% ${glowY}%`,
        }
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [elementRef, isHovering]);

  return styles;
}
