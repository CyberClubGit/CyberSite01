
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
    if (!url || !url.startsWith('https')) {
        console.error(`Invalid URL provided to fetchAndParseCsv: ${url}`);
        return [];
    }
    const response = await fetch(url, { cache: 'no-store'});
    if (!response.ok) {
      console.error(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    const csvText = await response.text();
    
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue;

        const values: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"';
                    j++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField);

        if (values.length >= headers.length) {
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });

            // Standardize column names: 'Item' -> 'Name', 'Url' -> 'Slug'
            const renamedRow: { [key: string]: any } = {};
            for (const key in row) {
                const lowerKey = key.toLowerCase().trim();
                if (lowerKey === 'item' || lowerKey === 'title') {
                    renamedRow['Name'] = row[key];
                } else if (lowerKey === 'url') {
                    renamedRow['Slug'] = row[key];
                } else {
                    renamedRow[key] = row[key];
                }
            }

            if (Object.values(renamedRow).some(v => v !== null && String(v).trim() !== '')) {
                data.push(renamedRow as T);
            }
        }
    }
    
    return data;
  } catch (error) {
    console.error(`Error during fetch or parse for ${url}:`, error);
    return []; 
  }
}


export const getCategories = unstable_cache(
  async () => {
    const masterSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv';
    const categoriesFromSheet = await fetchAndParseCsv<Category>(masterSheetUrl);

    // --- TEMPORARY WORKAROUND to fix incorrect GIDs in the master sheet ---
    const gidCorrectionMap: { [key: string]: string } = {
        'Home': '177392102', // This might still be master, but for consistency
        'Projects': '153094389',
        'Catalog': '581525493',
        'Research': '275243306',
        'Tool': '990396131', // Handles both "Tool" and "Tools"
        'Tools': '990396131',
        'Collabs': '2055846949',
        'Events': '376468249',
        'Ressources': '1813804988', // French spelling
        'Resources': '1813804988', // English spelling
    };

    const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=';
    const urlSuffix = '&single=true&output=csv';

    return categoriesFromSheet.map(category => {
        // Find the correct key in the map, case-insensitively
        const mapKey = Object.keys(gidCorrectionMap).find(k => k.toLowerCase() === category.Name.toLowerCase());

        if (mapKey) {
            const correctGid = gidCorrectionMap[mapKey];
            const newUrl = `${baseUrl}${correctGid}${urlSuffix}`;
            // Return a new object with the corrected URL
            return {
                ...category,
                'Url Sheet': newUrl,
            };
        }
        
        return category; // Return original if no correction is needed
    });
    // --- END OF WORKAROUND ---
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
      return fetchAndParseCsv<any>(sheetUrl);
    }
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'],
  { 
    revalidate: 300 // Revalidate every 5 minutes, same as others
  }
);

    