
'use client';

import { useState, useEffect, type RefObject } from 'react';

const MAX_ROTATION = 8; // Max rotation in degrees

export function useParallax(elementRef: RefObject<HTMLElement>) {
  const [styles, setStyles] = useState({
    cardStyle: {},
    glowStyle: {},
  });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let frameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        const mouseX = (clientX - innerWidth / 2) / (innerWidth / 2);
        const mouseY = (clientY - innerHeight / 2) / (innerHeight / 2);
        
        const rotateY = mouseX * MAX_ROTATION;
        const rotateX = -mouseY * MAX_ROTATION;
        const scale = isHovering ? 'scale(1.05)' : 'scale(1)';

        const glowX = 50 + mouseX * 25;
        const glowY = 50 + mouseY * 25;

        setStyles({
          cardStyle: {
            transform: `${scale} rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
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
  }, [isHovering]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset to a neutral state without hover scale but keeping parallax
    // The mousemove listener will handle the final transform value
  };

  return { ...styles, handleMouseEnter, handleMouseLeave };
}
