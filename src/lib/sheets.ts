import { unstable_cache } from 'next/cache';

export interface Category {
  'Name': string;
  'Url Logo Png': string;
  'Slug': string;
  'Background': string;
  'Url Sheet': string;
  'Url app': string;
}

export interface Brand {
  Brand: string;
  Activity: string;
  'Color Light': string;
  'Color Dark':string;
  Description: string;
  Logo: string;
}

const SPREADSHEET_ID = '2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1';
const MASTER_SHEET_GID = '177392102';
const BRAND_SHEET_GID = '1634708260';

const MASTER_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${MASTER_SHEET_GID}&single=true&output=csv`;
const BRAND_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${BRAND_SHEET_GID}&single=true&output=csv`;

async function fetchAndParseCsv<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) {
      console.error(`[Sheets] Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    const csvText = await response.text();
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    
    if (lines.length < 2) {
        console.warn(`[Sheets] CSV from ${url} has no data lines.`);
        return [];
    }

    const header = lines.shift()?.split(',') || [];
    
    return lines
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',');
        const obj: {[key: string]: string} = {};
        header.forEach((key, i) => {
          obj[key.trim()] = values[i]?.trim() || '';
        });
        return obj as T;
    });

  } catch (error) {
    console.error(`[Sheets] Error during fetch or parse for ${url}:`, error);
    return [];
  }
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const rawCategories = await fetchAndParseCsv<Category>(MASTER_SHEET_URL);
    return rawCategories.filter((category): category is Category => !!category.Name && !!category.Slug);
  },
  ['categories'],
  { revalidate: 300 }
);


export const getBrands = unstable_cache(
  async () => {
    console.log('[Sheets] Fetching Brand Sheet...');
    return fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
  },
  ['brands'],
  { revalidate: 300 }
);

export const getCategoryData = unstable_cache(
  async (slug: string) => {
    const categories = await getCategories();
    const category = categories.find(c => c.Slug && c.Slug.toLowerCase() === slug.toLowerCase());
    
    if (!category || !category['Url Sheet']) {
      console.warn(`[Sheets] getCategoryData: No sheet URL found for slug: ${slug}.`);
      return [];
    }
    
    const sheetUrl = category['Url Sheet'];
    if (!sheetUrl.startsWith('https')) {
        console.warn(`[Sheets] getCategoryData: Invalid sheet URL "${sheetUrl}" for slug: ${slug}.`);
        return [];
    }

    console.log(`[Sheets] Fetching data for slug "${slug}" from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData']
);
