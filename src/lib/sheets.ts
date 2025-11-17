
import { unstable_cache } from 'next/cache';

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
    console.error(`Error fetching or parsing CSV from ${url}:`, error);
    return [];
  }
}


export const getCategories = unstable_cache(
  async () => {
    const masterSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv';
    const categoriesFromSheet = await fetchAndParseCsv<Category>(masterSheetUrl);

    // --- TEMPORARY WORKAROUND ---
    const gidCorrectionMap: { [key: string]: string } = {
        'Home': '177392102', // This is still the master sheet, as no dedicated home sheet was identified
        'Projects': '153094389',
        'Catalog': '581525493',
        'Research': '275243306',
        'Tool': '990396131',
        'Tools': '990396131',
        'Collabs': '2055846949',
        'Events': '376468249',
        'Ressources': '1813804988',
        'Resources': '1813804988',
    };

    const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=';
    const urlSuffix = '&single=true&output=csv';

    return categoriesFromSheet.map(category => {
        const mapKey = Object.keys(gidCorrectionMap).find(k => k.toLowerCase() === category.Name.toLowerCase());
        
        if (mapKey) {
            const correctGid = gidCorrectionMap[mapKey];
            // We create a new object to avoid mutating the cached one, and assign the corrected URL
            return {
                ...category,
                'Url Sheet': `${baseUrl}${correctGid}${urlSuffix}`
            };
        }
        return category;
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
    // Do not fetch data if it's the master sheet GID for a page that should have its own data.
    const urlParams = new URLSearchParams(sheetUrl.split('?')[1]);
    const gid = urlParams.get('gid');

    if (gid === '177392102' && !sheetUrl.includes('Home')) { // Allow master for Home, but not others
        // Find category name from URL to decide if it's an intended master sheet load
        // This is complex, better to just block all but a specific case if needed.
        // For now, if a page that is NOT home points to master, we assume it's an error and return empty.
        // A better check could be done if category name was passed.
        // Let's assume for any page data fetch, pointing to master GID is wrong.
        return [];
    }

    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'],
  { 
    tags: ['categoryData'] 
  }
);
