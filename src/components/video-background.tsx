'use client';

import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  src: string;
}

export function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Cette petite astuce peut aider sur certains navigateurs mobiles
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, [src]);

  if (!src) return null;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      <video
        ref={videoRef}
        key={src} // Forcer le re-rendu si la source change
        className="absolute top-1/2 left-1/2 w-full h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
        autoPlay
        loop
        muted
        playsInline // Essentiel pour la lecture automatique sur iOS
      >
        <source src={src} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
      <div className="absolute inset-0 bg-black/30"></div> {/* Overlay optionnel */}
    </div>
  );
}
