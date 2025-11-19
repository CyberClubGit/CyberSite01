'use client';

import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  src: string;
}

export function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        // Silently fail if autoplay is blocked
      });
    }
  }, [src]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden z-[-1]">
      <video
        ref={videoRef}
        key={src}
        className="absolute top-1/2 left-1/2 w-full h-full object-cover transform -translate-x-1/2 -translate-y-1/2 invert dark:invert-0"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={src} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
      <div className="absolute inset-0 w-full h-full bg-white/80 dark:bg-black/80"></div>
    </div>
  );
}
