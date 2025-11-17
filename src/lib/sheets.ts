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
    const headers = lines[0].split(',').map(h => h.trim());
    const data: T[] = [];

    let currentLine = 1;
    while (currentLine < lines.length) {
        if (lines[currentLine].trim() === '') {
            currentLine++;
            continue;
        }

        const obj: any = {};
        let lineContent = lines[currentLine];
        
        for (const header of headers) {
            let value = '';
            
            lineContent = lineContent.trim();

            if (lineContent.startsWith('"')) {
                // Quoted field, potentially multi-line
                let closingQuoteIndex = -1;
                let content = '';
                
                let searchLine = lineContent;
                let searchLineIndex = currentLine;

                while (closingQuoteIndex === -1) {
                    content += searchLine.substring(searchLine.startsWith('"') ? 1 : 0);
                    
                    let i = 0;
                    while(i < content.length) {
                        if (content[i] === '"') {
                            if (i + 1 < content.length && content[i+1] === '"') {
                                i += 2; // Skip escaped quote
                            } else {
                                closingQuoteIndex = i;
                                break;
                            }
                        } else {
                            i++;
                        }
                    }

                    if (closingQuoteIndex !== -1) {
                        value = content.substring(0, closingQuoteIndex).replace(/""/g, '"');
                        const charsConsumed = value.replace(/"/g, '""').length + 2; // +2 for quotes
                        
                        let remainingInLine = lineContent.substring(charsConsumed);
                        if (remainingInLine.startsWith(',')) {
                            remainingInLine = remainingInLine.substring(1);
                        }
                        
                        // This logic has limitations with multiline AND multiple columns on one line
                        // It assumes the multiline quoted field ends the "visual" line in the source text editor
                        lineContent = remainingInLine;
                        currentLine = searchLineIndex;

                    } else {
                        searchLineIndex++;
                        if (searchLineIndex >= lines.length) {
                             throw new Error('Unclosed quote in CSV content');
                        }
                        searchLine = lines[searchLineIndex];
                        content += '\n'; // Add newline that was stripped by split()
                    }
                }
                 currentLine = searchLineIndex;

            } else {
                // Unquoted field
                const commaIndex = lineContent.indexOf(',');
                if (commaIndex !== -1) {
                    value = lineContent.substring(0, commaIndex);
                    lineContent = lineContent.substring(commaIndex + 1);
                } else {
                    value = lineContent;
                    lineContent = '';
                }
            }
            obj[header] = value.trim();
        }
        data.push(obj as T);
        currentLine++;
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
