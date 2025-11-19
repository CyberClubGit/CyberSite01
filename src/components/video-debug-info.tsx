'use client';

import { useEffect, useState } from 'react';

interface VideoDebugInfoProps {
  videoUrl: string;
}

export function VideoDebugInfo({ videoUrl }: VideoDebugInfoProps) {
  
  return (
    <div className="w-full max-w-2xl mx-auto border-2 border-yellow-500 p-4 my-4 text-xs bg-black/20">
      <h3 className="font-headline text-yellow-400 mb-2">Diagnostic Vidéo</h3>
      
      <div className="mb-2">
        <strong className="text-yellow-400">URL Source Vidéo :</strong>
        <p className="break-all font-mono">{videoUrl || 'Aucune URL fournie'}</p>
      </div>

      <div>
        <strong className="text-yellow-400">Note de débogage (CORS) :</strong>
         <p className="mt-1 text-yellow-500 font-mono">
           Un test de l'URL via un script `fetch` échouerait probablement ici à cause des restrictions de sécurité CORS de Google. Cependant, la balise &lt;video&gt; ci-dessus peut souvent charger la ressource quand même.
        </p>
        <p className="mt-2 text-yellow-600">
          **Test principal :** Essayez de lancer la lecture manuellement sur le lecteur vidéo. Si elle se lance, le lien est bon. Si elle ne se charge pas (spinner infini), le problème est ailleurs (URL invalide, fichier privé sur Drive, etc.).
        </p>
      </div>
    </div>
  );
}
