
import { unstable_cache } from 'next/cache';

export interface Category {
  Name: string;
  'Url Logo Png': string;
  Slug: string;
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

const SPREADSHEET_ID = '2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1';
const MASTER_SHEET_GID = '177392102';
const BRAND_SHEET_GID = '1634708260';

function buildCsvUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=${gid}&single=true&output=csv`;
}

const MASTER_SHEET_URL = buildCsvUrl(SPREADSHEET_ID, MASTER_SHEET_GID);
const BRAND_SHEET_URL = buildCsvUrl(SPREADSHEET_ID, BRAND_SHEET_GID);

// Centralized configuration for all sheet URLs
export const SHEET_LINKS: { [key: string]: string } = {
  home:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv',
  projects: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=153094389&single=true&output=csv',
  catalog:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=581525493&single=true&output=csv',
  research: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=275243306&single=true&output=csv',
  tool:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=990396131&single=true&output=csv',
  collabs:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l11/pub?gid=2055846949&single=true&output=csv',
  events:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=376468249&single=true&output=csv',
  ressources:'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=1813804988&single=true&output=csv'
};


// --- Robust CSV Parsing and Normalization Utils ---
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : null;

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; 
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}


async function fetchAndParseCsv<T>(url: string): Promise<T[]> {
  try {
    if (!url || !url.startsWith('https')) {
      console.error(`[Sheets] Invalid or empty URL provided: ${url}`);
      return [];
    }
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Sheets] Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    const csvText = await response.text();

    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) return [];
    
    const headerLine = lines.shift() || '';
    const headers = parseCsvLine(headerLine);
    
    const data: T[] = [];

    for (const line of lines) {
      if (!line || line.trim() === '') continue;

      const values = parseCsvLine(line);

      if (values.length >= headers.length) {
        const rowObject: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          rowObject[header] = values[index] || '';
        });
        data.push(rowObject as T);
      }
    }
    return data;
  } catch (error) {
    console.error(`[Sheets] Error during fetch or parse for ${url}:`, error);
    return [];
  }
}


export const getCategories = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const categories = await fetchAndParseCsv<Category>(MASTER_SHEET_URL);
    // We only use the master sheet to get the list of categories (for the menu), not their URLs.
    return categories.map(category => ({
      ...category,
      // The 'Url Sheet' from the master sheet is now ignored.
      // The correct URL will be picked from SHEET_LINKS in getCategoryData.
    }));
  },
  ['categories'],
  { revalidate: 300 } // 5 minutes
);


export const getBrands = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Brand Sheet...');
    return fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
  },
  ['brands'],
  { revalidate: 300 } // 5 minutes
);

export const getCategoryData = unstable_cache(
  async (categorySlug: string) => {
    const normalizedSlug = categorySlug.toLowerCase();
    const sheetUrl = SHEET_LINKS[normalizedSlug];

    if (!sheetUrl) {
      console.warn(`[Sheets] No URL configured for category slug: "${normalizedSlug}"`);
      return [];
    }
    console.log(`[Sheets] Fetching data for "${normalizedSlug}" from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'], // Note: This cache key is now dynamic based on the slug.
  {
    revalidate: 300 // 5 minutes
  }
);
