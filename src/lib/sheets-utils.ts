/**
 * Extract Google Drive URLs from a field.
 */
export function extractGoogleDriveUrls(field: string | undefined): string[] {
  if (!field || typeof field !== 'string') return [];
  
  // Regex to find Google Drive URLs, allows for different formats
  const urlRegex = /https:\/\/drive\.google\.com\/(?:open\?id=|file\/d\/)([a-zA-Z0-9_-]+)[\w\/=&]*/g;
  const matches = field.match(urlRegex);
  
  return matches || [];
}

/**
 * Get the first URL from a field.
 */
export function getFirstUrl(field: string | undefined): string | null {
  const urls = extractGoogleDriveUrls(field);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Extracts the Google Drive file ID from a URL.
 */
export function extractIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}


/**
 * Normalize and clean data from a raw sheet row.
 */
export function normalizeRowData(row: Record<string, string>) {
  const coverUrl = getFirstUrl(row.Cover || row.Image || row['Url Logo Png']);
  const galleryUrls = extractGoogleDriveUrls(row.Gallery || '');

  let displayImageUrl = null;
  if (coverUrl) {
    const coverId = extractIdFromUrl(coverUrl);
    if (coverId) {
        displayImageUrl = `https://drive.google.com/thumbnail?id=${coverId}`;
    }
  } else if (galleryUrls.length > 0) {
    const galleryId = extractIdFromUrl(galleryUrls[0]);
    if (galleryId) {
        displayImageUrl = `https://drive.google.com/thumbnail?id=${galleryId}`;
    }
  }


  return {
    ...row,
    // Multi-URLs:
    galleryUrls,
    
    // Single-URLs:
    coverUrl,
    displayImageUrl, // The URL to use for the main card image
    stlUrl: getFirstUrl(row.Stl || ''),
    pdfUrl: getFirstUrl(row.Pdf || ''),
    videoUrl: row.Video?.trim() || null,
    
    // Text fields:
    title: row.Title?.trim() || row.Name?.trim() || row.Item?.trim() || 'Untitled',
    description: row.Description?.trim() || row.Content?.trim() || '',
    author: row.Author?.trim() || '',
    date: row.Date?.trim() || '',
  };
}
