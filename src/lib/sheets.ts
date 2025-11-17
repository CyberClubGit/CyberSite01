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

    let i = 1;
    while (i < lines.length) {
        if (!lines[i].trim()) {
            i++;
            continue;
        }

        let currentLineContent = lines[i];
        const obj: any = {};
        
        for (const header of headers) {
            let value = '';
            
            if (currentLineContent.startsWith('"')) {
                // Handle quoted fields that may contain newlines
                let completeField = '';
                let inQuote = true;
                let searchIndex = i;
                let lineSlice = currentLineContent.substring(1); // Skip initial quote

                while (inQuote) {
                    const quoteIndex = lineSlice.indexOf('"');
                    if (quoteIndex === -1) {
                        // Newline is part of the field
                        completeField += lineSlice + '\n';
                        searchIndex++;
                        if (searchIndex >= lines.length) {
                             throw new Error('Unclosed quoted field in CSV');
                        }
                        lineSlice = lines[searchIndex];
                    } else {
                        // Quote found
                        if (quoteIndex + 1 < lineSlice.length && lineSlice[quoteIndex + 1] === '"') {
                            // Escaped quote
                            completeField += lineSlice.substring(0, quoteIndex + 1);
                            lineSlice = lineSlice.substring(quoteIndex + 2);
                        } else {
                            // End of quoted field
                            completeField += lineSlice.substring(0, quoteIndex);
                            currentLineContent = lineSlice.substring(quoteIndex + 1);
                            if (currentLineContent.startsWith(',')) {
                                currentLineContent = currentLineContent.substring(1);
                            }
                            inQuote = false;
                        }
                    }
                }
                value = completeField.replace(/""/g, '"');
                i = searchIndex;

            } else {
                // Handle unquoted fields
                const commaIndex = currentLineContent.indexOf(',');
                if (commaIndex !== -1) {
                    value = currentLineContent.substring(0, commaIndex);
                    currentLineContent = currentLineContent.substring(commaIndex + 1);
                } else {
                    value = currentLineContent;
                    currentLineContent = '';
                }
            }
            obj[header] = value.trim();
        }
        data.push(obj as T);
        i++;
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