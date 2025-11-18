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

// ===== PARSER CSV ROBUSTE =====
/**
 * Parse une ligne CSV en respectant les guillemets et échappements
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Guillemets échappés
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }
    
    if (char === ',' && !inQuotes) {
      // Fin du champ
      result.push(current.trim());
      current = '';
      i++;
      continue;
    }
    
    current += char;
    i++;
  }
  
  result.push(current.trim());
  return result;
}

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
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    
    if (lines.length < 2) {
      console.warn('[Sheets] No data rows in CSV');
      return [];
    }

    // Parse header avec parseCSVLine()
    const headerLine = lines.shift()!;
    const headers = parseCSVLine(headerLine);
    console.log(`[Sheets] ✅ Headers (${headers.length}) for ${url}:`, headers.join(', '));
    
    // Parse data rows
    const data: T[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      
      if (values.length !== headers.length) {
        console.warn(`[Sheets] Row ${i+1} in ${url}: Expected ${headers.length} columns, got ${values.length}. Line: "${line}"`);
      }
      
      const row: any = {};
      headers.forEach((key, idx) => {
        row[key] = values[idx] || '';
      });
      
      data.push(row as T);
    }
    
    console.log(`[Sheets] ✅ Loaded ${data.length} rows from ${url}`);
    return data;
    
  } catch (error) {
    const err = error as Error;
    console.error(`[Sheets] Fetch or Parse error for ${url}:`, err.message);
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
      Url: row['Url'] || '',
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
          console.log(`  - ${cat.Name} (Slug: ${cat.Url})`);
        });
    }
    
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
    console.log(`[Sheets] ✅ Loaded ${data.length} items for ${category.Name}`);
    
    return data;
  },
  ['categoryData'],
  { revalidate: 300 }
);
