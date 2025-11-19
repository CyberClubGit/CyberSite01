import { unstable_cache } from 'next/cache';
import { robustCsvParse, rowsToObjects } from './sheets-parser';
import { 
  convertGoogleDriveLinkToDirect, 
  extractAndConvertGalleryLinks,
  convertGoogleDriveLinkToDirectVideo
} from './google-drive-utils';

// ===== TYPES =====
export interface Category {
  Name: string;
  Description: string;
  'Url Logo Png': string;
  Url: string;
  Background: string;
  'Url Sheet': string;
  'Url app': string;
}

export interface Brand {
  Brand: string;
  Activity: string;
  'Color Light': string;
  'Color Dark': string;
  Description: string;
  Logo: string;
}

// ===== CONFIGURATION =====
const SPREADSHEET_ID = '2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1';
const MASTER_SHEET_GID = '177392102';
const BRAND_SHEET_GID = '1634708260';

const MASTER_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${MASTER_SHEET_GID}&single=true&output=csv`;
const BRAND_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${BRAND_SHEET_GID}&single=true&output=csv`;

// ===== HELPER: FETCH & PARSE CSV =====
async function fetchAndParseCsv<T>(url: string): Promise<T[]> {
  try {
    console.log(`[Sheets] Fetching: ${url}`);
    
    const response = await fetch(url, { 
      next: { revalidate: 300 } 
    });
    
    if (!response.ok) {
      console.error(`[Sheets] HTTP Error ${response.status}: ${response.statusText}`);
      return [];
    }
    
    const csvText = await response.text();
    
    if (!csvText.trim()) {
      console.warn('[Sheets] No data in CSV');
      return [];
    }
    
    // ✅ UTILISER LE PARSER ROBUSTE
    const rows = robustCsvParse(csvText);
    
    if (rows.length < 2) {
      console.warn('[Sheets] No data rows in CSV');
      return [];
    }
    
    // Log headers
    console.log(`[Sheets] Headers: ${rows[0].join(', ')}`);
    
    // Convertir en objets
    const data = rowsToObjects(rows) as T[];
    
    console.log(`[Sheets] ✅ Loaded ${data.length} rows`);
    return data;
    
  } catch (error) {
    const err = error as Error;
    console.error('[Sheets] Fetch error:', err.message);
    return [];
  }
}

// ===== FETCHER: CATEGORIES (MASTER SHEET) =====
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    console.log('[Sheets] === Fetching Categories (Master Sheet) ===');
    const rawData = await fetchAndParseCsv<any>(MASTER_SHEET_URL);
    
    // Transform raw data to Category interface
    const categories = rawData.map(row => ({
      Name: row['Name'] || row['Item'] || '',
      Description: row['Description'] || '',
      'Url Logo Png': row['Url Logo Png'] ? convertGoogleDriveLinkToDirect(row['Url Logo Png']) : '',
      Url: row['Url'] || '',
      Background: row['Background'] || '',
      'Url Sheet': row['Url Sheet'] || '',
      'Url app': row['Url app'] || '',
    }));
    
    // Filter valid categories
    const validCategories = categories.filter(cat => 
      cat.Name && cat.Url && cat['Url Sheet']
    );
    
    console.log(`[Sheets] Valid categories: ${validCategories.length}`);
    validCategories.forEach(cat => {
      console.log(`  - ${cat.Name} (${cat.Url}): ${cat['Url Sheet']}`);
    });
    
    return validCategories;
  },
  ['categories'],
  { revalidate: 300 }
);

// ===== FETCHER: BRANDS =====
export const getBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    console.log('[Sheets] === Fetching Brands ===');
    const rawBrands = await fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
    
    const brands = rawBrands.map(brand => ({
      ...brand,
      Logo: brand.Logo ? convertGoogleDriveLinkToDirect(brand.Logo) : '',
    }));

    return brands.filter(brand => !!brand.Brand);
  },
  ['brands'],
  { revalidate: 300 }
);

// ===== FETCHER: CATEGORY DATA =====
export const getCategoryData = unstable_cache(
  async (slug: string) => {
    console.log(`[Sheets] === Fetching Category Data for: ${slug} ===`);
    
    if (!slug) {
      console.warn('[Sheets] Empty slug provided');
      return [];
    }
    
    // Get all categories
    const categories = await getCategories();
    console.log(`[Sheets] Available categories: ${categories.map(c => c.Url).join(', ')}`);
    
    // Find matching category by Url (slug)
    const category = categories.find(c => 
      c.Url && c.Url.toLowerCase() === slug.toLowerCase()
    );
    
    if (!category) {
      console.warn(`[Sheets] No category found for slug: ${slug}`);
      return [];
    }
    
    console.log(`[Sheets] Found category: ${category.Name}`);
    console.log(`[Sheets] Sheet URL: ${category['Url Sheet']}`);
    
    // Fetch data from the category's sheet URL
    const sheetUrl = category['Url Sheet'];
    
    if (!sheetUrl) {
      console.warn(`[Sheets] No sheet URL for category: ${category.Name}`);
      return [];
    }
    
    // Fetch the actual data
    const data = await fetchAndParseCsv<any>(sheetUrl);
    console.log(`[Sheets] Loaded ${data.length} items for ${category.Name}`);
    
    return data;
  },
  ['categoryData'],
  { revalidate: 300 }
);

/**
 * Post-processing des données pour extraire et convertir les liens Google Drive
 * 
 * Utiliser cette fonction sur les données après getCategoryData()
 */
export function processGalleryLinks(item: Record<string, string>) {
  return {
    ...item,
    
    // Extraire et convertir les liens Gallery (multiples)
    galleryUrls: item.Gallery 
      ? extractAndConvertGalleryLinks(item.Gallery)
      : [],
    
    // Convertir les liens individuels
    coverUrl: item.Cover 
      ? convertGoogleDriveLinkToDirect(item.Cover)
      : null,
    
    stlUrl: item.Stl
      ? convertGoogleDriveLinkToDirect(item.Stl)
      : null,
      
    pdfUrl: item.Pdf
      ? convertGoogleDriveLinkToDirect(item.Pdf)
      : null,
      
    reelUrl: item.Reel
      ? convertGoogleDriveLinkToDirect(item.Reel)
      : null,
      
    videoUrl: item.Video
      ? convertGoogleDriveLinkToDirect(item.Video)
            : null,
  };
}

export { convertGoogleDriveLinkToDirectVideo };
