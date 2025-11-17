import { unstable_cache } from 'next/cache';

export interface Category {
  Item: string;
  'Url Logo Png': string;
  Url: string;
  Background: string;
  'Url Sheet': string;
}

export interface Brand {
  Brand: string;
  Activity: string;
  'Color Light': string;
  'Color Dark': string;
}

async function fetchAndParseCsv<T>(url:string): Promise<T[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    // Robust CSV parsing
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: T[] = [];

    const regex = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\",]*))(,|$)/g;

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;

        let line = lines[i];
        const obj: any = {};
        for(let j = 0; j < headers.length; j++){
            const header = headers[j];

            // If the line is empty, we are done
            if (line.trim() === '') {
                obj[header] = '';
                continue;
            }

            regex.lastIndex = 0; // Reset regex state
            const match = regex.exec(line);

            if (match) {
                // match[1] is the quoted value, match[2] is the unquoted value
                const value = match[1] !== undefined 
                    ? match[1].replace(/\"\"/g, '\"') // Unescape double quotes
                    : match[2];
                
                obj[header] = value.trim();

                // Move to the next part of the line
                line = line.substring(match[0].length);
            } else {
                obj[header] = '';
            }
        }
        data.push(obj as T);
    }


    return data;
  } catch (error) {
    console.error(`Error fetching or parsing CSV from ${url}:`, error);
    return [];
  }
}


export const getCategories = unstable_cache(
  async () => {
    const masterSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv';
    return fetchAndParseCsv<Category>(masterSheetUrl);
  },
  ['categories'],
  { revalidate: 300 } // Revalidate every 5 minutes
);

export const getBrands = unstable_cache(
  async () => {
    const brandSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=1634708260&single=true&output=csv';
    return fetchAndParseCsv<Brand>(brandSheetUrl);
  },
  ['brands'],
  { revalidate: 300 } // Revalidate every 5 minutes
);

export const getCategoryData = unstable_cache(
  async (sheetUrl: string) => {
    if (!sheetUrl) return [];
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'],
  { revalidate: 300 }
);