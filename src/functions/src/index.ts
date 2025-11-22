
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import "dotenv/config";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import fetch from "node-fetch";
import Papa from "papaparse";
import { defineSecret, setGlobalOptions } from "firebase-functions/params";

// Set global options for the region
setGlobalOptions({ region: "us-central1" });

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Safe initialization of Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// Lazily initialize Stripe
let stripe: Stripe;

function ensureStripeIsInitialized() {
  if (!stripe) {
    const key = stripeSecretKey.value();
    if (!key) {
      console.error("CRITICAL: STRIPE_SECRET_KEY is not defined.");
      throw new functions.https.HttpsError('internal', 'Stripe secret key is not configured on the server.');
    }
    console.info(`Stripe key loaded successfully (last 4 chars: ...${key.slice(-4)}).`);
    stripe = new Stripe(key, {
      apiVersion: "2024-06-20",
    });
  }
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=928586250&single=true&output=csv";

// #region Utility Functions
function cleanPrice(priceStr: string | undefined): number {
  if (!priceStr || typeof priceStr !== 'string' || priceStr.trim() === "") return 0;
  const cleaned = priceStr.replace(",", ".");
  const price = parseFloat(cleaned);
  if (isNaN(price)) return 0;
  return Math.round(price * 100); 
}

function getFirstImage(galleryStr: string): string | null {
  if (!galleryStr || galleryStr.trim() === "") return null;
  const images = galleryStr.split(/[\r\n]+/).filter((url) => url.trim() !== "");
  if (images.length === 0) return null;
  return images[0].trim();
}
// #endregion

export const syncProductsFromSheet = functions.runWith({secrets: [stripeSecretKey]}).https.onRequest(async (req, res) => {
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }
    
  functions.logger.info("Starting product synchronization from Google Sheet.");
  
  try {
    ensureStripeIsInitialized();
  } catch (error: any) {
    functions.logger.error("Stripe initialization failed:", error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  const summary = {
    created: [] as string[],
    updated: [] as string[],
    skipped: [] as string[],
    errors: [] as {id: string, error: string}[],
  };

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    const csvText = await response.text();
    
    const parsed = Papa.parse(csvText, {header: true, skipEmptyLines: true});
    const products = parsed.data as any[];

    for (const product of products) {
      const sheetId = product.ID?.trim();
      const productTitle = product.Title?.trim();

      if (!sheetId || !productTitle || sheetId.includes('#NAME?')) {
        summary.skipped.push(`Product with invalid ID or Title: ${JSON.stringify(product)}`);
        continue;
      }
      
      const pricePrint = cleanPrice(product.Price_Print);
      if (pricePrint === 0) {
        summary.skipped.push(`${productTitle} (ID: ${sheetId}) - No valid 'Price_Print'.`);
        continue;
      }

      try {
        const firstImage = getFirstImage(product.Gallery);

        const stripeProductData = {
            name: productTitle,
            description: product.Description,
            images: firstImage ? [firstImage] : [],
            active: true,
            metadata: {
                sheet_id: sheetId,
            },
        };
        
        const existingProducts = await stripe.products.search({
            query: `metadata['sheet_id']:'${sheetId}'`,
            limit: 1
        });
        
        let stripeProduct: Stripe.Product;

        if (existingProducts.data.length > 0) {
            stripeProduct = await stripe.products.update(existingProducts.data[0].id, stripeProductData);
            summary.updated.push(productTitle);
        } else {
            stripeProduct = await stripe.products.create(stripeProductData);
            summary.created.push(productTitle);
        }
        
        const productDocRef = db.collection("products").doc(stripeProduct.id);
        
        await productDocRef.set({
          name: stripeProduct.name,
          description: stripeProduct.description,
          images: stripeProduct.images,
          active: stripeProduct.active,
          metadata: { sheet_id: sheetId }
        });
        
        const existingPrices = await stripe.prices.list({ product: stripeProduct.id, active: true });
        for (const price of existingPrices.data) {
            await stripe.prices.update(price.id, { active: false });
        }
        
        const newPrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: pricePrint,
          currency: "eur",
          nickname: "Print Price",
        });

        const pricesCollectionRef = productDocRef.collection("prices");
        await pricesCollectionRef.doc(newPrice.id).set({
            active: newPrice.active,
            currency: newPrice.currency,
            description: newPrice.nickname,
            unit_amount: newPrice.unit_amount,
        });


      } catch (error: any) {
        functions.logger.error(`Error processing product ${sheetId}:`, error.message);
        summary.errors.push({id: sheetId, error: error.message});
      }
    }

    functions.logger.info("Synchronization finished.", summary);
    res.status(200).json({
      success: true,
      message: `Synchronization complete. Processed ${products.length} rows.`,
      results: summary,
    });
  } catch (error: any) {
    functions.logger.error("Fatal error during synchronization:", error);
    res.status(500).json({
      success: false,
      message: `Synchronization failed: ${error.message}`,
    });
  }
});


export const createCheckoutSession = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
  try {
    ensureStripeIsInitialized();
  } catch (error: any) {
    functions.logger.error("Stripe initialization failed in createCheckoutSession:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an array of "items".');
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of data.items) {
    if (!item.id || item.id.includes('#NAME?')) {
        functions.logger.warn(`Invalid or missing sheet_id for item in cart: ${item.id}. Skipping.`);
        continue;
    }
    
    try {
      // Step 1: Search for the product in Stripe using the sheet_id metadata
      const products = await stripe.products.search({
        query: `metadata['sheet_id']:'${item.id}'`,
        limit: 1
      });

      if (products.data.length === 0) {
        functions.logger.error(`Product with sheet_id '${item.id}' not found in Stripe. Please re-sync products.`);
        throw new functions.https.HttpsError('not-found', `Product with ID '${item.id}' could not be found. Please contact support.`);
      }
      
      const stripeProduct = products.data[0];

      // Step 2: List active prices for that product
      const prices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          limit: 1, 
      });

      if (prices.data.length === 0) {
          functions.logger.error(`No active price found for Stripe product ID: ${stripeProduct.id} (sheet_id: ${item.id})`);
          throw new functions.https.HttpsError('not-found', `A price for '${stripeProduct.name}' could not be found. Please contact support.`);
      }

      line_items.push({
        price: prices.data[0].id,
        quantity: item.quantity,
      });

    } catch (error: any) {
       functions.logger.error(`Failed to process item with sheet_id ${item.id}:`, error);
       if (error instanceof functions.https.HttpsError) throw error; // Re-throw specific errors
       throw new functions.https.HttpsError('internal', `An error occurred while processing item ${item.id}.`);
    }
  }

  if (line_items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No valid items were found to create a checkout session.');
  }

  const origin = context.rawRequest.headers.origin || 'http://localhost:9002';
  const success_url = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/checkout/cancel`;

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items,
        success_url,
        cancel_url,
    };
    
    if (context.auth?.token?.email) {
      sessionParams.customer_email = context.auth.token.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new functions.https.HttpsError('internal', 'Could not create a checkout session URL.');
    }

    return { url: session.url };

  } catch (error: any) {
    functions.logger.error('Stripe checkout session creation failed:', error);
    throw new functions.https.HttpsError('internal', `Stripe error: ${error.message}`);
  }
});
