
import { collection, getDocs, getFirestore } from 'firebase/firestore/lite';
import { firebaseApp } from '@/firebase/config';
import { unstable_cache } from 'next/cache';

// Initialiser Firestore
const db = getFirestore(firebaseApp);

// Définir l'interface pour les données de produit
export interface Product {
  id: string;
  active: boolean;
  name: string;
  description: string | null;
  images: string[];
  type: string | null;
  style: string | null;
  material: string | null;
  activity: string | null;
  metadata: {
    sheetId: string;
    stl_url: string | null;
  };
}

/**
 * Récupère tous les produits depuis la collection 'products' de Firestore.
 * Utilise unstable_cache pour la mise en cache côté serveur.
 */
export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    console.log('[Firestore] === Fetching Products ===');
    try {
      const productsCol = collection(db, 'products');
      const productSnapshot = await getDocs(productsCol);
      
      const productList = productSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          active: data.active || false,
          name: data.name || 'Untitled',
          description: data.description || null,
          images: data.images || [],
          type: data.type || null,
          style: data.style || null,
          material: data.material || null,
          activity: data.activity || null,
          metadata: {
            sheetId: data.metadata?.sheetId || '',
            stl_url: data.metadata?.stl_url || null,
          },
        } as Product;
      });

      console.log(`[Firestore] ✅ Loaded ${productList.length} products`);
      return productList.filter(p => p.active); // Ne retourner que les produits actifs
    } catch (error) {
      const err = error as Error;
      console.error('[Firestore] Fetch error:', err.message);
      return [];
    }
  },
  ['products'], // Clé de cache
  { revalidate: 300 } // Revalider toutes les 5 minutes
);
