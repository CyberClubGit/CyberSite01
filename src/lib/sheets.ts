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
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    
    const data: T[] = lines.slice(1).map(line => {
      const values = line.split(',');
      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header] = values[index]?.trim() || '';
      });
      return entry as T;
    });

    return data;
  } catch (error) {
    console.error(`Error fetching or parsing CSV from ${url}:`, error);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
    const masterSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv';
    return fetchAndParseCsv<Category>(masterSheetUrl);
}

export async function getBrands(): Promise<Brand[]> {
    const brandSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=1634708260&single=true&output=csv';
    return fetchAndParseCsv<Brand>(brandSheetUrl);
}
