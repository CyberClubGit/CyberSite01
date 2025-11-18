
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
  'Color Dark':string;
  Description: string;
  Logo: string;
}

const SPREADSHEET_ID = '2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1';
const MASTER_SHEET_GID = '177392102';
const BRAND_SHEET_GID = '1634708260';

const MASTER_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${MASTER_SHEET_GID}&single=true&output=csv`;
const BRAND_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${BRAND_SHEET_GID}&single=true&output=csv`;

const SHEET_URLS: Record<string, string> = {
    home: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv`,
    projects: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=153094389&single=true&output=csv`,
    catalog: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=581525493&single=true&output=csv`,
    research: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=275243306&single=true&output=csv`,
    tools: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=990396131&single=true&output=csv`,
    collabs: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=2055846949&single=true&output=csv`,
    events: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=376468249&single=true&output=csv`,
    ressources: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=1813804988&single=true&output=csv`
};

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
      .filter(line => line.trim() !== '') // Ignore empty lines
      .map(line => {
        const values = line.split(',');
        const obj: {[key: string]: string} = {};
        header.forEach((key, i) => {
          const rawValue = values[i] || '';
          obj[key.trim()] = rawValue.trim();
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
    const rawCategories = await fetchAndParseCsv<any>(MASTER_SHEET_URL);

    return rawCategories
        .map(category => ({
            Name: category.Name,
            'Url Logo Png': category['Url Logo Png'],
            Slug: category.Slug,
            Background: category.Background,
            'Url Sheet': category['Url Sheet'],
            'Url app': category['Url app'],
        }))
        .filter((category): category is Category => !!category.Name && !!category.Slug);
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
    const sheetUrl = SHEET_URLS[slug.toLowerCase()];
    if (!sheetUrl) {
      console.warn(`[Sheets] getCategoryData called with an invalid slug: ${slug}. No URL found.`);
      return [];
    }
    console.log(`[Sheets] Fetching data for slug "${slug}" from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData']
);
