
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

// --- Robust CSV Parsing and Normalization Utils ---

/**
 * Normalizes a category name for comparison.
 * - Trims whitespace from start/end
 * - Converts to lowercase
 * - Replaces multiple spaces with a single one
 */
function normalizeCategoryName(name: string | undefined): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Robustly parses a single line of a CSV file, handling quoted fields.
 */
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
        i++; // Skip the escaped quote
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

/**
 * Fetches a CSV from a URL and parses it into an array of objects.
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

// Normalized GID correction map (keys are lowercase)
const gidCorrectionMap: { [key: string]: string } = {
  'home': '177392102',
  'projects': '153094389',
  'catalog': '581525493',
  'research': '275243306',
  'tools': '990396131',
  'collabs': '2055846949',
  'events': '376468249',
  'ressources': '1813804988'
};

export const getCategories = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const categories = await fetchAndParseCsv<Category>(MASTER_SHEET_URL);

    // Apply GID corrections using normalization
    return categories.map(category => {
      const normalizedName = normalizeCategoryName(category.Name);
      const correctedGid = gidCorrectionMap[normalizedName];

      if (correctedGid) {
        const newUrl = buildCsvUrl(SPREADSHEET_ID, correctedGid);
        if (category['Url Sheet'] !== newUrl) {
           console.log(`[Sheets] Correcting GID for "${category.Name}" (normalized: "${normalizedName}"). New URL: ${newUrl}`);
           category['Url Sheet'] = newUrl;
        }
      } else {
        console.warn(`[Sheets] No GID correction found for category "${category.Name}" (normalized: "${normalizedName}")`);
      }
      return category;
    });
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
  async (sheetUrl: string) => {
     if (!sheetUrl) {
      console.warn(`[Sheets] getCategoryData called with an empty URL.`);
      return [];
    }
    console.log(`[Sheets] Fetching data from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'], // Note: Next.js handles caching based on parameters
  {
    revalidate: 300 // 5 minutes
  }
);
