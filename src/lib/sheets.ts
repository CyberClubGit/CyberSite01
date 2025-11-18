import { unstable_cache } from 'next/cache';

// ===== TYPES =====
export interface Category {
  Name: string;
  'Url Logo Png': string;
  Url: string; // This is the slug for the category
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
      console.error(`[Sheets] HTTP Error ${response.status}: ${response.statusText} for ${url}`);
      return [];
    }
    
    const csvText = await response.text();
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    
    if (lines.length < 2) {
      console.warn(`[Sheets] No data rows in CSV from ${url}`);
      return [];
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    console.log(`[Sheets] Headers from ${url}: ${header.join(', ')}`);
    
    // Parse data rows
    const data: T[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      const row: any = {};
      header.forEach((key, idx) => {
        const value = (values[idx] || '').trim().replace(/^"|"$/g, '');
        row[key] = value;
      });
      
      data.push(row as T);
    }
    
    console.log(`[Sheets] Loaded ${data.length} rows from ${url}`);
    return data;
    
  } catch (error) {
    const err = error as Error;
    console.error(`[Sheets] Fetch error for ${url}:`, err.message);
    return [];
  }
}

// ===== FETCHER: CATEGORIES (MASTER SHEET) =====
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    console.log('[Sheets] === Fetching Categories (Master Sheet) ===');
    const rawData = await fetchAndParseCsv<any>(MASTER_SHEET_URL);
    
    const categories = rawData.map(row => ({
      Name: row['Name'] || row['Item'] || '',
      'Url Logo Png': row['Url Logo Png'] || '',
      Url: row['Url'] || '', // This is the slug
      Background: row['Background'] || '',
      'Url Sheet': row['Url Sheet'] || '',
      'Url app': row['Url app'] || '',
    }));
    
    const validCategories = categories.filter(cat => 
      cat.Name && cat.Url && cat['Url Sheet']
    );
    
    console.log(`[Sheets] Valid categories count: ${validCategories.length}`);
    if (validCategories.length > 0) {
        console.log('[Sheets] Valid categories found:');
        validCategories.forEach(cat => {
          console.log(`  - ${cat.Name} (Slug: ${cat.Url}): ${cat['Url Sheet']}`);
        });
    } else {
        console.warn('[Sheets] No valid categories found after parsing. Check Master Sheet columns.');
    }
    
    return validCategories;
  },
  ['categories'],
  { revalidate: 300 } // Revalidate categories every 5 minutes
);

// ===== FETCHER: BRANDS =====
export const getBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    console.log('[Sheets] === Fetching Brands ===');
    const brands = await fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
    const validBrands = brands.filter(brand => !!brand.Brand);
    console.log(`[Sheets] Valid brands count: ${validBrands.length}`);
    return validBrands;
  },
  ['brands'],
  { revalidate: 300 }
);

// ===== FETCHER: CATEGORY DATA =====
export const getCategoryData = unstable_cache(
  async (slug: string) => {
    console.log(`[Sheets] === Fetching Category Data for slug: "${slug}" ===`);
    
    if (!slug) {
      console.warn('[Sheets] getCategoryData: Empty slug provided.');
      return [];
    }
    
    const categories = await getCategories();
    
    const category = categories.find(c => 
      c.Url && c.Url.toLowerCase() === slug.toLowerCase()
    );
    
    if (!category) {
      console.warn(`[Sheets] getCategoryData: No category found for slug: "${slug}"`);
      return [];
    }
    
    const sheetUrl = category['Url Sheet'];
    console.log(`[Sheets] Found category "${category.Name}" with sheet URL: ${sheetUrl}`);
    
    if (!sheetUrl || !sheetUrl.startsWith('https://')) {
      console.warn(`[Sheets] getCategoryData: Invalid or missing sheet URL for category: ${category.Name}`);
      return [];
    }
    
    const data = await fetchAndParseCsv<any>(sheetUrl);
    console.log(`[Sheets] Loaded ${data.length} items for ${category.Name}`);
    
    return data;
  },
  ['categoryData'],
  // Note: We are caching per slug implicitly by how unstable_cache works with arguments.
  // Revalidation is set on the function itself.
  { revalidate: 300 }
);