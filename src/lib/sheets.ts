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

async function fetchAndParseCsv<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    const lines = csvText.trim().split('\r\n').join('\n').split('\n');
    if (lines.length < 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: T[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i] || lines[i].trim() === '') continue;

        const row: any = {};
        let currentLine = lines[i];
        let inQuote = false;
        let field = '';
        let headerIndex = 0;

        for (let j = 0; j < currentLine.length; j++) {
            const char = currentLine[j];

            if (char === '"') {
                if (inQuote && j + 1 < currentLine.length && currentLine[j + 1] === '"') {
                    field += '"';
                    j++; // Skip the next quote
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                row[headers[headerIndex]] = field.trim();
                field = '';
                headerIndex++;
            } else if (char === '\n' && !inQuote) {
                 //This should not happen with the split but as a safeguard
                 row[headers[headerIndex]] = field.trim();
                 field = '';
                 headerIndex++;
            }
             else {
                field += char;
            }
        }
        
        while (inQuote && i + 1 < lines.length) {
            i++;
            currentLine = lines[i];
            field += '\n';

            for (let j = 0; j < currentLine.length; j++) {
                const char = currentLine[j];

                if (char === '"') {
                   if (inQuote && j + 1 < currentLine.length && currentLine[j + 1] === '"') {
                        field += '"';
                        j++; // Skip next quote
                    } else {
                        inQuote = !inQuote;
                    }
                } else {
                    field += char;
                }
            }
        }
        
        row[headers[headerIndex]] = field.trim();
        
        // Only add non-empty rows
        if (Object.values(row).some(v => v !== '')) {
            data.push(row as T);
        }
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
  ['categoryData'], // This key will be extended with the sheetUrl
  { 
    revalidate: 300,
    // The `tags` option allows us to create dynamic cache keys.
    // By adding the sheetUrl to the tags, we ensure each sheet has its own cache entry.
    tags: ['categoryData'] 
  }
);