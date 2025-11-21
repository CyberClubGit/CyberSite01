
'use server';

// This file is being kept for the Product type definition,
// but server-side fetching has been moved to the client to resolve auth issues.

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
