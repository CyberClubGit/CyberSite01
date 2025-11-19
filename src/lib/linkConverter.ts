
import { extractGoogleDriveId } from './google-drive-utils';

/**
 * Extracts the YouTube video ID from various URL formats.
 */
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Creates an embeddable URL for YouTube or Google Drive videos.
 *
 * - For YouTube, it creates a clean embed link (no cookies, autoplay, no controls).
 * - For Google Drive, it creates a direct embed link.
 */
export function getEmbeddableVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&controls=0&mute=1&loop=1&playlist=${youtubeId}`;
  }

  const googleDriveId = extractGoogleDriveId(url);
  if (googleDriveId) {
    return `https://drive.google.com/file/d/${googleDriveId}/preview`;
  }

  // Fallback for direct video links
  return url;
}

/**
 * Creates a proxied URL for a PDF to bypass CORS issues, especially for Google Drive.
 * This allows client-side libraries like pdf.js to render thumbnails.
 */
export function getProxiedPdfUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const googleDriveId = extractGoogleDriveId(url);
  if (googleDriveId) {
    // This is the direct download link for Google Drive files
    const directUrl = `https://drive.google.com/uc?export=download&id=${googleDriveId}`;
    // We wrap it in a CORS proxy
    return `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
  }
  
  // For other URLs, we also try the proxy
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}
