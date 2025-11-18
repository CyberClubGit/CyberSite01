import { unstable_cache } from 'next/cache';

// ===== TYPES =====
export interface Category {
  Name: string;
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
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    
    if (lines.length < 2) {
      console.warn('[Sheets] No data rows in CSV');
      return [];
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    console.log(`[Sheets] Headers: ${header.join(', ')}`);
    
    // Parse data rows
    const data: T[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma, respecting quotes
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      const row: any = {};
      header.forEach((key, idx) => {
        const value = (values[idx] || '').trim().replace(/^"|"$/g, '');
        row[key] = value;
      });
      
      data.push(row as T);
    }
    
    console.log(`[Sheets] Loaded ${data.length} rows`);
    return data;
    
  } catch (error) {
    console.error('[Sheets] Fetch error:', error);
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
      'Url Logo Png': row['Url Logo Png'] || '',
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
    const brands = await fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
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