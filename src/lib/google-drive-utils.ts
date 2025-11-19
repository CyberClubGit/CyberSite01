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
 * Convertir un lien Google Drive en lien direct (thumbnail)
 * 
 * Input:  https://drive.google.com/file/d/1ABC/view
 * Output: https://drive.google.com/thumbnail?id=1ABC
 */
export function convertGoogleDriveLinkToDirect(url: string): string {
  const fileId = extractGoogleDriveId(url);
  
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}`;
  }
  
  return url; // Fallback: retourner l'URL originale
}

/**
 * Séparer les liens multiples dans une cellule
 * 
 * Dans Google Sheets, quand tu fais Alt+Enter, ça crée un \n
 * Cette fonction détecte et sépare ces liens
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
 * 
 * Use case: Colonne "Gallery" avec plusieurs liens séparés par \n
 */
export function extractAndConvertGalleryLinks(cellContent: string): string[] {
  const links = splitMultipleLinks(cellContent);
  return links.map(link => convertGoogleDriveLinkToDirect(link));
}