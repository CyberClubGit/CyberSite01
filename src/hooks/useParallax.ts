
'use client';

import { useState, useEffect, type RefObject } from 'react';

const MAX_ROTATION = 8; // Max rotation in degrees

export function useParallax(elementRef: RefObject<HTMLElement>) {
  const [styles, setStyles] = useState({
    cardStyle: {},
    glowStyle: {},
  });

  useEffect(() => {
    let frameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        // Calculate mouse position relative to the viewport center (-1 to 1)
        const mouseX = (clientX - innerWidth / 2) / (innerWidth / 2);
        const mouseY = (clientY - innerHeight / 2) / (innerHeight / 2);
        
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
          },
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []); // Empty dependency array, effect runs once and cleans up on unmount

  return styles;
}
