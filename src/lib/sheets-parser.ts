/**
 * Parser CSV robuste qui gère:
 * - Guillemets avec virgules
 * - Sauts de ligne dans les cellules
 * - Guillemets échappés
 * 
 * Basé sur la logique éprouvée de l'application précédente
 */
export function robustCsvParse(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentCell = '';
  let currentRow: string[] = [];
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    // Gestion des guillemets
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Guillemets échappés: "" devient "
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
      continue;
    }
    
    // Virgule = séparateur SEULEMENT si pas dans quotes
    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }
    
    // Saut de ligne = fin de ligne SEULEMENT si pas dans quotes
    if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell)) { // Only add non-empty rows
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }
    
    // Skip \r in \r\n pairs
    if (char === '\r' && nextChar === '\n') {
      continue;
    }
    
    // Ajouter le caractère au cell actuel
    currentCell += char;
  }
  
  // Ajouter la dernière ligne
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell)) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

/**
 * Convertir les lignes brutes en objets avec headers
 */
export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  
  const [headerRow, ...dataRows] = rows;
  
  return dataRows.map(row => {
    const obj: Record<string, string> = {};
    headerRow.forEach((header, idx) => {
      obj[header] = row[idx] || '';
    });
    return obj;
  });
}