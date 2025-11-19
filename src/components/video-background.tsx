
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
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      <video
        key={src} // Important to re-mount the video element on src change
        className="absolute top-1/2 left-1/2 w-full h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/50"></div>
    </div>
  );
}
