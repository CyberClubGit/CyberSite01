
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
        console.error(`[Sheets] Invalid URL provided: ${url}`);
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

        // Robust CSV line parsing
        const values: string[] = [];
        let currentField = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = j + 1 < line.length ? line[j+1] : null;

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"'; // Escaped quote
                    j++;
                } else {
                    inQuotes = !inQuotes; // Start or end of a quoted field
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
                 // Remove surrounding quotes if they exist
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1).replace(/""/g, '"');
                }
                
                // Standardize common column names on the fly for consistency
                if (header === 'Item' || header === 'Title') {
                    rowObject['Name'] = value;
                } else if (header === 'Url') {
                    rowObject['Slug'] = value;
                } else {
                    rowObject[header] = value;
                }
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

    // --- TEMPORARY WORKAROUND to fix incorrect GIDs in the master sheet ---
    const gidCorrectionMap: { [key: string]: string } = {
        'Home': '177392102',
        'Projects': '153094389',
        'Catalog': '581525493',
        'Research': '275243306',
        'Tool': '990396131',
        'Tools': '990396131',
        'Collabs': '2055846949',
        'Events': '376468249',
        'Ressources': '1813804988',
        'Resources': '1813804988'
    };
    const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=';
    const urlSuffix = '&single=true&output=csv';

    return categoriesFromSheet.map(category => {
      const mapKey = Object.keys(gidCorrectionMap).find(k => k.toLowerCase() === category.Name.toLowerCase());
      if (mapKey) {
          const correctGid = gidCorrectionMap[mapKey];
          // We create a new object to avoid mutating the cached one, and assign the corrected URL
          return {
              ...category,
              'Url Sheet': `${baseUrl}${correctGid}${urlSuffix}`,
          };
      }
      return category;
    });
    // --- END OF WORKAROUND ---

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
    console.log(`[Sheets] Fetching data for category from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'], // Base key, Next.js will add the arguments to make it unique
  { 
    revalidate: 300 // 5 minutes
  }
);
