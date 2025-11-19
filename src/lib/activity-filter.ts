
/**
 * Mapping Brand -> Activity
 * Source: Site-Database-Activity.csv
 */
export const BRAND_ACTIVITY_MAP: Record<string, string | null> = {
  'Cyber Club': null,         // null = afficher tout
  'Artefact': 'Design',
  'ArchNTech': 'Architecture',
  'Synthetic': 'Multimedias',
  'Para Wear': 'Textile',
  'Eva': 'Nature',
  'MekaTek': 'Mecatronics',
};

/**
 * Obtenir l'Activity associée à un Brand
 */
export function getActivityForBrand(brandName: string): string | null {
  return BRAND_ACTIVITY_MAP[brandName] || null;
}

/**
 * Filtrer les items par Activity selon le Brand sélectionné
 * 
 * @param items - Liste complète des items
 * @param selectedBrandName - Nom du Brand actuellement sélectionné
 * @returns Items filtrés selon l'Activity du Brand
 */
export function filterItemsByBrandActivity<T extends Record<string, any>>(
  items: T[],
  selectedBrandName: string | undefined
): T[] {
  // Si pas de brand sélectionné ou Cyber Club -> afficher tout
  if (!selectedBrandName || selectedBrandName === 'Cyber Club') {
    return items;
  }
  
  // Obtenir l'Activity du Brand
  const targetActivity = getActivityForBrand(selectedBrandName);
  
  // Si pas d'Activity trouvée pour ce brand -> afficher tout (sécurité)
  if (!targetActivity) {
    return items;
  }
  
  // Filtrer les items qui ont cette Activity
  return items.filter(item => {
    // Gère les variations de casse et de nom de colonne ('Activity' vs 'activity')
    const itemActivity = item.Activity || item.activity || '';
    return itemActivity.toLowerCase() === targetActivity.toLowerCase();
  });
}
