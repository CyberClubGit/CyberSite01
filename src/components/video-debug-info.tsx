'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';

interface VideoDebugInfoProps {
  videoUrl: string;
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';
type VideoEvent = { name: string; time: string; message?: string };

export function VideoDebugInfo({ videoUrl }: VideoDebugInfoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoEvents, setVideoEvents] = useState<VideoEvent[]>([]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const eventListeners: Record<string, (e: Event) => void> = {
      error: (e) => {
        const videoError = (e.target as HTMLVideoElement).error;
        addEvent('error', `Code ${videoError?.code}: ${videoError?.message}`);
      },
      stalled: () => addEvent('stalled', 'Le navigateur essaie de récupérer des données, mais elles ne sont pas disponibles.'),
      waiting: () => addEvent('waiting', 'La lecture s\'est arrêtée car la prochaine image n\'est pas disponible.'),
      suspend: () => addEvent('suspend', 'Le chargement des données a été suspendu.'),
      canplay: () => addEvent('canplay', 'Le navigateur peut commencer la lecture.'),
    };

    const addEvent = (name: string, message?: string) => {
      setVideoEvents(prev => [...prev, { name, time: new Date().toLocaleTimeString(), message }]);
    };

    Object.entries(eventListeners).forEach(([eventName, handler]) => {
      videoElement.addEventListener(eventName, handler);
    });

    return () => {
      Object.entries(eventListeners).forEach(([eventName, handler]) => {
        videoElement.removeEventListener(eventName, handler);
      });
    };
  }, [videoUrl, blobUrl]);

  const handleTestLoad = async () => {
    setStatus('loading');
    setError(null);
    setVideoEvents([]);
    
    try {
      // Utilisation d'un proxy API pour contourner CORS
      const response = await fetch(`/api/cors-proxy?url=${encodeURIComponent(videoUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      
      const videoBlob = await response.blob();
      
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }

      const newBlobUrl = URL.createObjectURL(videoBlob);
      setBlobUrl(newBlobUrl);
      setStatus('success');

    } catch (e: any) {
      setError(`Échec du chargement via proxy: ${e.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto border-2 border-dashed border-yellow-500 p-4 my-4 text-xs bg-black/50 text-white">
      <h3 className="font-headline text-yellow-400 mb-2 text-lg">Diagnostic Vidéo Avancé</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <strong className="text-yellow-400 block mb-1">Lecteur de Test :</strong>
          <video
            ref={videoRef}
            key={blobUrl || videoUrl}
            src={blobUrl || videoUrl}
            width="100%"
            controls
            className="bg-black mb-2"
          >
            Votre navigateur ne supporte pas la balise vidéo.
          </video>
          <p className="text-gray-400 text-xs">
            {blobUrl ? 'Mode de lecture : URL Blob (local)' : 'Mode de lecture : URL Directe (Google Drive)'}
          </p>
        </div>
        <div>
          <strong className="text-yellow-400 block mb-1">Actions de Diagnostic :</strong>
          <div className="mb-2">
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">1. Tester le lien de téléchargement direct &rarr;</a>
          </div>
          <Button onClick={handleTestLoad} disabled={status === 'loading'} className="bg-yellow-600 hover:bg-yellow-700 text-black">
            {status === 'loading' ? 'Chargement...' : '2. Tester le chargement via Proxy (Blob URL)'}
          </Button>

          <div className="mt-4">
            <strong className="text-yellow-400">Statut du Test :</strong>
            {status === 'idle' && <p>En attente de test.</p>}
            {status === 'loading' && <p className="text-yellow-500">Chargement de la vidéo en mémoire...</p>}
            {status === 'success' && <p className="text-green-500">Succès ! La vidéo est chargée en Blob. Essayez de la lire.</p>}
            {status === 'error' && <p className="text-red-500">Erreur : {error}</p>}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <strong className="text-yellow-400">Journal des Événements du Lecteur Vidéo :</strong>
        {videoEvents.length > 0 ? (
          <div className="font-mono bg-black/50 p-2 rounded-md h-32 overflow-y-auto mt-1">
            {videoEvents.map((event, i) => (
              <div key={i}>
                <span className="text-gray-500">{event.time}</span> - <span className="text-green-400">{event.name}</span>
                {event.message && <span className="text-gray-300">: {event.message}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-gray-500 mt-1">Aucun événement capturé. Lancez un test ou essayez de lire la vidéo.</p>
        )}
      </div>
    </div>
  );
}
