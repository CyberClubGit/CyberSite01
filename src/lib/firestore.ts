
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/firebase/admin-config';
import { unstable_cache } from 'next/cache';

// Initialize the admin app
initializeAdminApp();

// Get a reference to the Firestore database
const db = getFirestore();

// Define the interface for the product data
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
 * Fetches all products from the 'products' collection in Firestore using the Admin SDK.
 * Uses unstable_cache for server-side caching.
 */
export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    console.log('[Firestore Admin] === Fetching Products ===');
    try {
      const productsCol = db.collection('products');
      const productSnapshot = await productsCol.get();

      if (productSnapshot.empty) {
        console.log('[Firestore Admin] No products found.');
        return [];
      }

      const productList = productSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          active: data.active ?? false,
          name: data.name ?? 'Untitled',
          description: data.description ?? null,
          images: data.images ?? [],
          type: data.type ?? null,
          style: data.style ?? null,
          material: data.material ?? null,
          activity: data.activity ?? null,
          metadata: {
            sheetId: data.metadata?.sheetId ?? '',
            stl_url: data.metadata?.stl_url ?? null,
          },
        } as Product;
      });

      console.log(`[Firestore Admin] ✅ Loaded ${productList.length} products`);
      return productList.filter(p => p.active); // Return only active products
    } catch (error) {
      const err = error as Error;
      console.error('[Firestore Admin] Fetch error:', err.message);
      // In a production environment, you might want to throw the error
      // or handle it differently. For now, we return an empty array.
      return [];
    }
  },
  ['products'], // Cache key
  { revalidate: 300 } // Revalidate every 5 minutes
);
