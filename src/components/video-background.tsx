
'use client';

import { useEffect, useState } from 'react';

interface VideoBackgroundProps {
  src: string;
}

export function VideoBackground({ src }: VideoBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !src) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
      <video
        key={src} 
        className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={src} type="video/mp4" />
        Votre navigateur ne supporte pas la balise vidéo.
      </video>
      <div className="absolute inset-0 bg-black/50"></div>
    </div>
  );
}
