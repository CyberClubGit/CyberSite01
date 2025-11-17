
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

function buildCsvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${gid}&single=true&output=csv`;
}

const MASTER_SHEET_URL = buildCsvUrl(MASTER_SHEET_GID);
const BRAND_SHEET_URL = buildCsvUrl(BRAND_SHEET_GID);

async function fetchAndParseCsv<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) {
      console.error(`[Sheets] Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    const csvText = await response.text();
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) return [];

    const headerLine = lines.shift() || '';
    // Simple CSV parsing for headers
    const headers = headerLine.split(',');

    const data: T[] = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        // Simple CSV parsing for lines
        const values = line.split(',');
        const rowObject: { [key: string]: any } = {};
        headers.forEach((header, index) => {
            rowObject[header.trim()] = values[index]?.trim() || '';
        });
        data.push(rowObject as T);
    }
    return data;
  } catch (error) {
    console.error(`[Sheets] Error during fetch or parse for ${url}:`, error);
    return [];
  }
}

// Correction map for GIDs
const gidCorrectionMap: { [key: string]: string } = {
    'Home': '177392102',
    'Projects': '153094389',
    'Catalog': '581525493',
    'Research': '275243306',
    'Tool': '990396131',
    'Collabs': '2055846949',
    'Events': '376468249',
    'Ressources': '1813804988'
};

export const getCategories = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const categories = await fetchAndParseCsv<Category>(MASTER_SHEET_URL);

    // Apply GID corrections
    return categories.map(category => {
      const correctedGid = gidCorrectionMap[category.Name];
      if (correctedGid) {
          const newUrl = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${correctedGid}&single=true&output=csv`;
          category['Url Sheet'] = newUrl;
      }
      return category;
    }).filter(category => category.Name && category.Slug); // Filter out empty/invalid rows
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
  ['categoryData'],
  {
    revalidate: 300 // 5 minutes
  }
);
