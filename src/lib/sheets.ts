
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
    const headerTrimmed = header.map(h => h.trim());

    const data: T[] = lines.map(line => {
      const values = line.split(',');
      const rowObject: { [key: string]: any } = {};
      headerTrimmed.forEach((key, index) => {
        // Re-join values that were incorrectly split by commas within a URL
        if (key === 'Url Sheet' || key === 'Background' || key === 'Url Logo Png' || key === 'Url app') {
          rowObject[key] = values.slice(index).join(',').trim();
        } else {
          rowObject[key] = values[index]?.trim() || '';
        }
      });
      
      // A more robust way to handle the URL splitting issue is to find the columns that should contain URLs
      // and stitch them back together. This is still a bit of a hack.
      const urlSheetIndex = headerTrimmed.indexOf('Url Sheet');
      if (urlSheetIndex !== -1) {
          const urlParts = values.slice(urlSheetIndex);
          (rowObject as any)['Url Sheet'] = urlParts.join(',').trim();
      }

      return rowObject as T;
    }).map(row => {
        // A final cleaning pass to stitch the object correctly
        const cleanRow: { [key: string]: any } = {};
        const rowValues = line.split(',');
        let valueIndex = 0;
        for (const headerKey of headerTrimmed) {
            if (valueIndex < rowValues.length) {
                // If a field is known to potentially contain commas, we need a better strategy.
                // For now, let's assume the simple split is what we have to work with and
                // the primary issue is the `Url Sheet` field being last.
                if (headerKey === 'Url Sheet') {
                    cleanRow[headerKey] = rowValues.slice(valueIndex).join(',');
                    break; 
                } else {
                    cleanRow[headerKey] = rowValues[valueIndex];
                }
                valueIndex++;
            }
        }
        return cleanRow as T;
    });

    // Let's use the simplest robust parser: one that handles CSV correctly.
    // Since we don't have a library, we'll write a small one.
    const robustParser = (csv: string): T[] => {
        const lines = csv.trim().replace(/\r\n/g, '\n').split('\n');
        if (lines.length < 2) return [];
        const header = lines.shift()!.split(',').map(h => h.trim());
        
        return lines.map(line => {
            const obj: { [key: string]: string } = {};
            // This is a naive regex-based CSV parser that handles simple cases
            // but not quoted fields containing newlines. It should be enough for this sheet.
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            
            header.forEach((key, i) => {
                const value = (values[i] || '').replace(/"/g, '').trim();
                obj[key] = value;
            });
            return obj as T;
        });
    }

    const finalData = robustParser(csvText);

    // console.log('[Sheets] Parsed Data:', JSON.stringify(finalData, null, 2));

    return finalData;

  } catch (error) {
    console.error(`[Sheets] Error during fetch or parse for ${url}:`, error);
    return [];
  }
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    console.log('[Sheets] Fetching Master Sheet for categories list...');
    const rawCategories = await fetchAndParseCsv<any>(MASTER_SHEET_URL);

    return rawCategories.map(category => {
      return {
        Name: category.Name,
        'Url Logo Png': category['Url Logo Png'],
        Slug: category.Slug,
        Background: category.Background,
        'Url Sheet': category['Url Sheet'],
        'Url app': category['Url app'],
      };
    }).filter((category): category is Category => !!category.Name && !!category.Slug);
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
      console.warn(`[Sheets] getCategoryData called with an invalid slug: ${slug}`);
      return [];
    }
    console.log(`[Sheets] Fetching data for slug "${slug}" from: ${sheetUrl}`);
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData']
);

    