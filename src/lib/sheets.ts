
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
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) {
      console.error(`[Sheets] Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    const csvText = await response.text();
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) return [];

    const header = lines.shift()?.split(',') || [];

    const data: T[] = lines.map(line => {
      const values = line.split(',');
      const rowObject: { [key: string]: any } = {};
      header.forEach((key, index) => {
        rowObject[key.trim()] = values[index]?.trim() || '';
      });
      return rowObject as T;
    });

    return data;
  } catch (error) {
    console.error(`[Sheets] Error during fetch or parse for ${url}:`, error);
    return [];
  }
}

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
  async (): Promise<Category[]> => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const rawCategories = await fetchAndParseCsv<any>(MASTER_SHEET_URL);

    return rawCategories.map(category => {
      const name = category.Name || category.Item;
      const correctedGid = gidCorrectionMap[name];
      
      let correctedUrlSheet = category['Url Sheet'];
      if (correctedGid) {
          correctedUrlSheet = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${correctedGid}&single=true&output=csv`;
      }
      
      return {
        Name: name,
        'Url Logo Png': category['Url Logo Png'],
        Slug: category.Slug,
        Background: category.Background,
        'Url Sheet': correctedUrlSheet,
        'Url app': category['Url app'],
      };
    }).filter((category): category is Category => !!category.Name && !!category.Slug);
  },
  ['categories']
);


export const getBrands = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Brand Sheet...');
    return fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
  },
  ['brands']
);

export const getCategoryData = unstable_cache(
  async (sheetUrl: string) => {
    if (!sheetUrl || !sheetUrl.startsWith('http')) {
      console.warn(`[Sheets] getCategoryData called with an invalid URL: ${sheetUrl}`);
      return [];
    }
    console.log(`[Sheets] Fetching data from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData']
);
