
/**
 * Mapping Brand → Activity
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
 * Parser les activities multiples d'un item
 * Format attendu: "Design, Architecture, Nature" ou "Design"
 */
export function parseItemActivities(activityString: string): string[] {
  if (!activityString || typeof activityString !== 'string') {
    return [];
  }
  
  return activityString
    .split(',')                    // Séparer par virgule
    .map(activity => activity.trim())  // Nettoyer espaces
    .filter(activity => activity.length > 0);  // Supprimer vides
}

/**
 * Vérifier si un item contient une Activity spécifique
 * Gère les multi-activities (ex: "Design, Architecture, Nature")
 */
export function itemHasActivity(itemActivityString: string, targetActivity: string): boolean {
  const itemActivities = parseItemActivities(itemActivityString);
  const normalizedTarget = targetActivity.toLowerCase().trim();
  
  return itemActivities.some(activity => 
    activity.toLowerCase() === normalizedTarget
  );
}


/**
 * Filtrer les items par Activity selon le Brand sélectionné
 * ✅ GÈRE LES MULTI-ACTIVITIES
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
  
  // ✅ FILTRER en vérifiant si l'Activity est PRÉSENTE (pas strictement égale)
  return items.filter(item => {
    const itemActivityString = item.Activity || item.activity || '';
    return itemHasActivity(itemActivityString, targetActivity);
  });
}