import { unstable_cache } from 'next/cache';

// ✅ FIX 1: Interface sans quotes inutiles
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

const MASTER_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${MASTER_SHEET_GID}&single=true&output=csv`;
const BRAND_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${BRAND_SHEET_GID}&single=true&output=csv`;

// ✅ FIX 2: Map de correction des gids
const gidCorrectionMap: { [key: string]: string } = {
  'Home': '177392102',      // Master Sheet (ou vrai Home gid?)
  'Projects': '153094389',
  'Catalog': '581525493',
  'Research': '275243306',
  'Tools': '990396131',
  'Collabs': '2055846949',
  'Events': '376468249',
  'Ressources': '1813804988'
};

async function fetchAndParseCsv<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Sheets] Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    const csvText = await response.text();
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    
    if (lines.length < 2) {
      console.warn(`[Sheets] CSV from ${url} has no data lines.`);
      return [];
    }

    const header = lines.shift()!.split(',');
    
    return lines
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        const obj: { [key: string]: string } = {};
        header.forEach((key, i) => {
          const cleanKey = key.trim();
          const cleanValue = (values[i] || '').trim().replace(/^"|"$/g, '');
          obj[cleanKey] = cleanValue;
        });
        return obj as T;
      });

  } catch (error) {
    console.error(`[Sheets] Error during fetch or parse for ${url}:`, error);
    return [];
  }
}

// ✅ FIX 2: Appliquer correction dans getCategories
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const rawCategories = await fetchAndParseCsv<Category>(MASTER_SHEET_URL);
    
    return rawCategories
      .filter((category): category is Category => !!category.Name && !!category.Slug)
      .map(category => {
        const name = category.Name.trim();
        // Handle "Tool" vs "Tools" inconsistency
        const mapName = name === 'Tools' ? 'Tool' : name;
        const correctedGid = gidCorrectionMap[mapName];
        
        if (correctedGid) {
          const correctedUrl = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${correctedGid}&single=true&output=csv`;
          console.log(`[Sheets] Correcting URL for ${name}: gid=${correctedGid}`);
          return {
            ...category,
            'Url Sheet': correctedUrl
          };
        }
        
        return category;
      });
  },
  ['categories'],
  { revalidate: 300 }
);

export const getBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    console.log('[Sheets] Fetching Brand Sheet...');
    const rawBrands = await fetchAndParseCsv<Brand>(BRAND_SHEET_URL);
    return rawBrands.filter(brand => !!brand.Brand);
  },
  ['brands'],
  { revalidate: 300 }
);

export const getCategoryData = unstable_cache(
  async (slug: string) => {
    if (!slug) {
        console.warn(`[Sheets] getCategoryData: Received empty slug.`);
        return [];
    }
    const categories = await getCategories();
    const category = categories.find(c => c.Slug && c.Slug.toLowerCase() === slug.toLowerCase());
    
    if (!category || !category['Url Sheet']) {
      console.warn(`[Sheets] getCategoryData: No sheet URL found for slug: ${slug}.`);
      return [];
    }
    
    const sheetUrl = category['Url Sheet'];

    if (!sheetUrl.startsWith('https://docs.google.com/spreadsheets/d/e/')) {
        console.warn(`[Sheets] getCategoryData: Invalid sheet URL "${sheetUrl}" for slug: ${slug}.`);
        return [];
    }

    console.log(`[Sheets] Fetching data for slug "${slug}" from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData']
);
