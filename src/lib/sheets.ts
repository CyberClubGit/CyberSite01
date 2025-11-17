
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

const MASTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv';
const BRAND_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=1634708260&single=true&output=csv';

/**
 * Fetches a public Google Sheet as a CSV and parses it into an array of objects.
 * This function is robust and handles quoted fields containing commas.
 * @param url The public URL of the Google Sheet, ending in 'output=csv'.
 * @returns A promise that resolves to an array of objects, where each object represents a row.
 */
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

    const headers = lines[0].split(',').map(h => h.trim());
    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue;

        const values: string[] = [];
        let currentField = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = j + 1 < line.length ? line[j+1] : null;

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField);

        if (values.length >= headers.length) {
            const rowObject: { [key: string]: any } = {};
            headers.forEach((header, index) => {
                let value = values[index] ? values[index].trim() : '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1).replace(/""/g, '"');
                }
                
                const standardizedHeader = header === 'Item' ? 'Name' : header === 'Url' ? 'Slug' : header;
                rowObject[standardizedHeader] = value;
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

/**
 * Fetches and parses the Master Sheet to get the list of all categories.
 * This function trusts the Master Sheet as the single source of truth for category URLs.
 * It is cached for 5 minutes.
 */
export const getCategories = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Master Sheet for categories...');
    const categoriesFromSheet = await fetchAndParseCsv<Category>(MASTER_SHEET_URL);
    return categoriesFromSheet;
  },
  ['categories'],
  { revalidate: 300 } // 5 minutes
);

/**
 * Fetches and parses the Brand Sheet to get the list of all brands and their styles.
 * It is cached for 5 minutes.
 */
export const getBrands = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Brand Sheet...');
    return fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
  },
  ['brands'],
  { revalidate: 300 } // 5 minutes
);

/**
 * Fetches and parses the data for a specific category using the URL provided.
 * This function is designed to fetch data from any sheet URL passed to it.
 * It is cached for 5 minutes. The cache key is the sheet URL itself.
 * @param sheetUrl The full, public URL of the Google Sheet to fetch.
 */
export const getCategoryData = unstable_cache(
  async (sheetUrl: string) => {
    if (!sheetUrl) {
        console.warn('[Sheets] getCategoryData called with an empty URL.');
        return [];
    }
    console.log(`[Sheets] Fetching category data from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'], // Base key, Next.js will add the arguments to make it unique
  { 
    revalidate: 300 // 5 minutes
  }
);
