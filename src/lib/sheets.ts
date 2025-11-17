
import { unstable_cache as next_unstable_cache } from 'next/cache';

// Wrapper to check for the existence of the cache store.
const unstable_cache: typeof next_unstable_cache = (
  ...args: Parameters<typeof next_unstable_cache>
) => {
  const store = (next_unstable_cache as any).getCacheStore?.();
  if (!store) {
    // If the cache store is not available, we're likely in a context
    // where caching is not supported (e.g., certain client-side error renderings).
    // We return a no-op version of the cached function.
    const fn = args[0];
    return fn as any;
  }
  return next_unstable_cache(...args);
};

export interface Category {
  Name: string;
  'Url Logo Png': string;
  Slug: string;
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
      console.error(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      // Return empty array for client-side resilience, preventing page crashes.
      return [];
    }
    const csvText = await response.text();
    
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
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
                const header = headers[headerIndex];
                if (header) {
                    row[header] = field.trim().replace(/^"|"$/g, '');
                }
                field = '';
                headerIndex++;
            } else {
                field += char;
            }
        }
        
        while (inQuote && i + 1 < lines.length) {
            i++;
            field += '\n' + lines[i];

            if (lines[i].endsWith('"')) {
                inQuote = false;
                field = field.slice(0, -1);
            }
        }
        
        const lastHeader = headers[headerIndex];
        if (lastHeader) {
            row[lastHeader] = field.trim().replace(/^"|"$/g, '');
        }
        
        if (Object.values(row).some(v => v !== null && String(v).trim() !== '')) {
            const renamedRow: any = {};
            for (const key in row) {
                if (key.toLowerCase().trim() === 'item') {
                    renamedRow['Name'] = row[key];
                } else if (key.toLowerCase().trim() === 'url') {
                    renamedRow['Slug'] = row[key];
                } else {
                    renamedRow[key] = row[key];
                }
            }
            data.push(renamedRow as T);
        }
    }
    
    return data;
  } catch (error) {
    console.error(`Error during fetch or parse for ${url}:`, error);
    return []; // Return empty array on any failure.
  }
}


export const getCategories = unstable_cache(
  async () => {
    const masterSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv';
    const categoriesFromSheet = await fetchAndParseCsv<Category>(masterSheetUrl);
    return categoriesFromSheet;
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
    if (!sheetUrl) {
        return [];
    }
    const store = (next_unstable_cache as any).getCacheStore?.();
    if (!store) {
      return [];
    }

    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'],
  { 
    tags: ['categoryData'] 
  }
);
