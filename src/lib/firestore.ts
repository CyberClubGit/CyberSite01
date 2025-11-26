
'use server';

import { initializeAdminApp } from '@/firebase/admin-config';

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
 * Fetches all active products from the Firestore collection using the Admin SDK.
 * This function is intended to be used on the server side.
 */
export async function getProducts(): Promise<Product[]> {
  console.log('[Firestore Admin] Initializing to fetch products...');
  try {
    const admin = initializeAdminApp();
    if (!admin) {
      console.error('[Firestore Admin] SDK initialization failed. Cannot fetch products.');
      return [];
    }

    const db = admin.firestore();
    const productsCol = db.collection('products');
    const productSnapshot = await productsCol.get();
    
    if (productSnapshot.empty) {
      console.log('[Firestore Admin] No products found in the collection.');
      return [];
    }

    const productList = productSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Product))
      .filter(product => product.active === true);

    console.log(`[Firestore Admin] Successfully fetched ${productList.length} active products.`);
    return productList;
  } catch (error) {
    const err = error as Error;
    console.error('[Firestore Admin] Fetch error:', err.message);
    // In a production environment, you might want to throw the error
    // or handle it differently. For now, we return an empty array.
    return [];
  }
}
