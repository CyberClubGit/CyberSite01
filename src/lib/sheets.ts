
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
      throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
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
            // Rename 'Item' to 'Name' and 'Url' to 'Slug' for consistency
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
    const categories = await fetchAndParseCsv<Category>(masterSheetUrl);

    // --- TEMPORARY WORKAROUND ---
    // This overrides incorrect GIDs from the Master Sheet.
    // This should be removed once the Google Sheet is corrected.
    const correctGids: { [key: string]: string } = {
        'Home': '177392102', // This one should still point to master, as per diagnostic
        'Projects': '153094389',
        'Catalog': '581525493',
        'Research': '275243306',
        'Tool': '990396131',
        'Collabs': '2055846949',
        'Events': '376468249',
        'Ressources': '1813804988',
    };
    
    // The sheet names are slightly different in some cases
    const gidCorrectionMap: { [key: string]: string } = {
      'Home': '177392102', // This will still load the master sheet, but we'll handle it. Let's assume there is NO home sheet for now.
      'Projects': '153094389',
      'Catalog': '581525493',
      'Research': '275243306',
      'Tools': '990396131', // Correcting 'Tool' to 'Tools' if that is the actual name
      'Collabs': '2055846949',
      'Events': '376468249',
      'Resources': '1813804988' // Correcting 'Ressources' to 'Resources'
    };


    const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=';
    const urlSuffix = '&single=true&output=csv';

    return categories.map(category => {
        // Find a matching key in gidCorrectionMap (case-insensitive and forgiving for plurals)
        const mapKey = Object.keys(gidCorrectionMap).find(k => k.toLowerCase() === category.Name.toLowerCase() || k.toLowerCase() === category.Name.toLowerCase() + 's');
        
        if (mapKey) {
            const correctGid = gidCorrectionMap[mapKey];
            const currentGid = new URLSearchParams(category['Url Sheet'].split('?')[1]).get('gid');
            
            if (currentGid !== correctGid) {
                console.log(`CODE WORKAROUND: Overriding GID for ${category.Name}: ${currentGid} -> ${correctGid}`);
                category['Url Sheet'] = `${baseUrl}${correctGid}${urlSuffix}`;
            }
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
    if (!sheetUrl || new URLSearchParams(sheetUrl.split('?')[1]).get('gid') === '177392102') {
        // Do not fetch data if it's the master sheet GID, except for the home page itself.
        // For now, returning an empty array for any page (like Home, Tools) that incorrectly pointed to master.
        return [];
    }
    return fetchAndParseCsv<any>(sheetUrl);
  },
  ['categoryData'],
  { 
    tags: ['categoryData'] 
  }
);
