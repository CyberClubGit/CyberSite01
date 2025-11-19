/**
 * Extraire l'ID d'un lien Google Drive
 * 
 * Patterns supportés:
 * - https://drive.google.com/file/d/ID/view
 * - https://drive.google.com/open?id=ID&usp=...
 * - Tout lien contenant ?id=ID ou &id=ID
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Pattern 1: /file/d/ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  
  // Pattern 2: /open?id=ID
  const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];
  
  // Pattern 3: ?id=ID ou &id=ID (anywhere in URL)
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  
  return null;
}

/**
 * Convertir un lien Google Drive en lien direct (thumbnail/image)
 */
export function convertGoogleDriveLinkToDirect(url: string): string {
  const fileId = extractGoogleDriveId(url);
  
  if (fileId) {
    // Utilise le format lh3 pour les images/miniatures, qui est plus fiable pour <img>
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  return url; // Fallback: retourner l'URL originale
}

/**
 * Convertir un lien Google Drive en lien direct pour une vidéo MP4.
 * Utilise le format `uc?export=download` qui force le téléchargement direct du contenu.
 * C'EST LE FORMAT LE PLUS FIABLE POUR LA BALISE <video>.
 */
export function convertGoogleDriveLinkToDirectVideo(url: string): string {
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}


/**
 * Séparer les liens multiples dans une cellule
 */
export function splitMultipleLinks(cellContent: string): string[] {
  if (!cellContent || typeof cellContent !== 'string') return [];
  
  return cellContent
    .split('\n')
    .map(link => link.trim())
    .filter(link => link.length > 0);
}

/**
 * Extraire et convertir tous les liens Google Drive d'une cellule
 */
export function extractAndConvertGalleryLinks(cellContent: string): string[] {
  const links = splitMultipleLinks(cellContent);
  return links.map(link => convertGoogleDriveLinkToDirect(link));
}
