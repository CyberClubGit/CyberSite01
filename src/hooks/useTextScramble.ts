
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\?%*()[]{}<>#&@';
const GLITCH_INTERVAL = 20;
const GLITCH_DURATION = 60;
const MIN_LETTER_DELAY = 35;
const MAX_LETTER_DELAY = 60;

export function useTextScramble(targetText: string, startImmediately = true) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const scramble = useCallback(() => {
    setIsTyping(true);
    // Initialize display text with empty spaces to set the initial width
    setDisplayText(' '.repeat(targetText.length));

    let cumulativeDelay = 0;

    targetText.split('').forEach((targetChar, index) => {
      const letterDelay = Math.random() * (MAX_LETTER_DELAY - MIN_LETTER_DELAY) + MIN_LETTER_DELAY;
      cumulativeDelay += letterDelay;

      const startGlitchTimeout = setTimeout(() => {
        const glitchInterval = setInterval(() => {
          const randomChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[index] = randomChar;
            return chars.join('');
          });
        }, GLITCH_INTERVAL);

        intervalsRef.current.push(glitchInterval);

        const lockTimeout = setTimeout(() => {
          clearInterval(glitchInterval);
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[index] = targetChar;
            return chars.join('');
          });

          if (index === targetText.length - 1) {
            setTimeout(() => setIsTyping(false), 200);
          }
        }, GLITCH_DURATION);

        timeoutsRef.current.push(lockTimeout);
      }, cumulativeDelay);

      timeoutsRef.current.push(startGlitchTimeout);
    });
  }, [targetText]);

  useEffect(() => {
    if (startImmediately && targetText) {
      scramble();
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
      timeoutsRef.current = [];
      intervalsRef.current = [];
    };
  }, [targetText, startImmediately, scramble]);

  return { displayText, isTyping };
}
