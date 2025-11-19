'use client';

import { useEffect, useState } from 'react';

interface VideoDebugInfoProps {
  videoUrl: string;
}

interface FetchInfo {
  status: number | null;
  statusText: string | null;
  contentType: string | null;
  contentLength: string | null;
  error: string | null;
}

export function VideoDebugInfo({ videoUrl }: VideoDebugInfoProps) {
  const [fetchInfo, setFetchInfo] = useState<FetchInfo>({
    status: null,
    statusText: null,
    contentType: null,
    contentLength: null,
    error: null,
  });

  useEffect(() => {
    if (!videoUrl) return;

    const testUrl = async () => {
      try {
        // We use 'cors' mode to simulate what the <video> tag does.
        const response = await fetch(videoUrl, { method: 'HEAD', mode: 'cors' });
        setFetchInfo({
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('Content-Type'),
          contentLength: response.headers.get('Content-Length'),
          error: null,
        });
      } catch (err: any) {
        // A 'TypeError: Failed to fetch' often indicates a CORS problem.
        console.error("Video debug fetch error:", err);
        setFetchInfo({
          status: null,
          statusText: null,
          contentType: null,
          contentLength: null,
          error: `Fetch Error: ${err.message}. (This often indicates a CORS issue if it happens in the browser.)`,
        });
      }
    };

    testUrl();
  }, [videoUrl]);

  return (
    <div className="w-full max-w-2xl mx-auto border-2 border-yellow-500 p-4 my-4 text-xs bg-black/20">
      <h3 className="font-headline text-yellow-400 mb-2">Diagnostic Vidéo</h3>
      
      <div className="mb-2">
        <strong className="text-yellow-400">URL Source Vidéo :</strong>
        <p className="break-all font-mono">{videoUrl || 'Aucune URL fournie'}</p>
      </div>

      <div>
        <strong className="text-yellow-400">Infos Réponse HTTP (via `fetch`):</strong>
        {fetchInfo.error ? (
          <p className="text-red-400 font-mono">{fetchInfo.error}</p>
        ) : (
          <ul className="font-mono list-disc list-inside">
            <li>Status: {fetchInfo.status ?? '...'} {fetchInfo.statusText ?? ''}</li>
            <li>Content-Type: {fetchInfo.contentType ?? '...'}</li>
            <li>Content-Length: {fetchInfo.contentLength ? `${fetchInfo.contentLength} bytes` : '...'}</li>
          </ul>
        )}
      </div>
       <p className="mt-2 text-yellow-600">
        Si le statut est 200 et que le Content-Type est `video/mp4`, le problème est ailleurs. Si une erreur `CORS` ou une redirection (statut 3xx) apparaît, c'est la cause probable.
      </p>
    </div>
  );
}