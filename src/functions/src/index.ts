
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
import { defineSecret, setGlobalOptions } from "firebase-functions/params";
import { HttpsError } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import Papa from "papaparse";

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
      throw new HttpsError('internal', 'La clé secrète Stripe n\'est pas configurée sur le serveur.');
    }
    stripe = new Stripe(key, {
      apiVersion: "2024-06-20",
    });
  }
}

export const createCheckoutSession = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
  try {
    ensureStripeIsInitialized();
  } catch (error: any) {
    functions.logger.error("Stripe initialization failed in createCheckoutSession:", error);
    throw new HttpsError('internal', error.message);
  }

  // Validate cart data
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpsError('invalid-argument', 'La fonction doit être appelée avec un tableau "items" non vide.');
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of data.items) {
    // **SERVER-SIDE VALIDATION**
    const invalidIdRegex = /[#?]/;
    if (!item.id || typeof item.id !== 'string' || invalidIdRegex.test(item.id)) {
        const errorMsg = `Article invalide : ID manquant ou contenant des caractères non autorisés. ID reçu: '${item.id}'`;
        functions.logger.error(errorMsg, {item});
        throw new HttpsError('invalid-argument', errorMsg);
    }
    if (!item.name) {
        const errorMsg = `Article invalide : Nom manquant. Article ID: ${item.id}`;
        functions.logger.error(errorMsg, {item});
        throw new HttpsError('invalid-argument', errorMsg);
    }
    if (typeof item.price !== 'number' || !Number.isInteger(item.price) || item.price <= 0) {
        const errorMsg = `Article invalide : '${item.name}'. Le prix doit être un nombre entier positif (en centimes), mais a reçu '${item.price}'.`;
        functions.logger.error(errorMsg, {item});
        throw new HttpsError('invalid-argument', errorMsg);
    }
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        const errorMsg = `Article invalide : '${item.name}'. La quantité doit être un nombre entier positif, mais a reçu '${item.quantity}'.`;
        functions.logger.error(errorMsg, {item});
        throw new HttpsError('invalid-argument', errorMsg);
    }

    try {
      // Create a temporary product and price in Stripe for this transaction
      const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: item.price, // Price is expected in cents here
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            sheet_id: item.id // Keep track of the original ID from the sheet
          }
        }
      });
      
      line_items.push({
        price: price.id,
        quantity: item.quantity,
      });

    } catch (error: any) {
       functions.logger.error(`Failed to create Stripe price for item ${item.id}:`, error);
       // Check for specific Stripe invalid character error
       if (error.code === 'parameter_invalid_string' && error.param === 'product_data[metadata][sheet_id]') {
            throw new HttpsError('invalid-argument', `L'ID de l'article '${item.name}' ('${item.id}') contient des caractères non valides pour Stripe.`);
       }
       throw new HttpsError('internal', `Une erreur est survenue lors du traitement de l'article ${item.name}.`);
    }
  }

  if (line_items.length === 0) {
    throw new HttpsError('failed-precondition', 'Aucun article valide n\'a été traité pour créer une session de paiement.');
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
    
    // Add customer email if the user is authenticated
    if (context.auth?.token?.email) {
      sessionParams.customer_email = context.auth.token.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new HttpsError('internal', 'Impossible de créer une URL de session de paiement.');
    }

    return { url: session.url };

  } catch (error: any) {
    functions.logger.error('Stripe checkout session creation failed:', error);
    throw new HttpsError('internal', `Erreur Stripe: ${error.message}`);
  }
});


// #region --- Sync Function ---
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=928586250&single=true&output=csv";

function cleanPrice(priceStr: string): number {
    if (!priceStr || priceStr.trim() === "") return 0;
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

// Converted to an onCall function for secure client-side invocation
export const syncProductsFromSheet = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
    // Optional: Add authentication check if needed in the future
    // if (!context.auth) {
    //     throw new HttpsError('unauthenticated', 'Vous devez être authentifié pour lancer la synchronisation.');
    // }
    
    functions.logger.info("Starting product synchronization from Google Sheet...", { structuredData: true });
    
    try {
        ensureStripeIsInitialized();
    } catch (error: any) {
        functions.logger.error("Stripe initialization failed:", error);
        throw new HttpsError('internal', error.message);
    }

    const summary = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        errorDetails: [] as { id?: string, title?: string, error: string }[],
    };

    try {
        functions.logger.log("Fetching CSV from Google Sheet...");
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
        }
        const csvText = await response.text();
        functions.logger.log("CSV fetched successfully.");

        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const products = parsed.data as any[];
        functions.logger.log(`Parsed ${products.length} products from CSV.`);
        summary.processed = products.length;

        for (const product of products) {
            const productId = product.ID?.trim();
            const productTitle = product.Title?.trim();

            if (!productId || !productTitle || productId.includes('#NAME?')) {
                summary.skipped++;
                summary.errorDetails.push({ id: productId, title: productTitle, error: "Missing or invalid ID/Title." });
                continue;
            }

            const priceModel = cleanPrice(product.Price_Model);
            const pricePrint = cleanPrice(product.Price_Print);

            if (priceModel === 0 && pricePrint === 0) {
                summary.skipped++;
                continue;
            }

            try {
                const firstImage = getFirstImage(product.Gallery);
                const stripeProductData = {
                    name: productTitle,
                    description: product.Description,
                    images: firstImage ? [firstImage] : [],
                    active: true,
                    metadata: { sheet_id: productId },
                };

                let stripeProduct: Stripe.Product;
                const existingProducts = await stripe.products.search({ query: `metadata['sheet_id']:'${productId}'` });

                if (existingProducts.data.length > 0) {
                    stripeProduct = await stripe.products.update(existingProducts.data[0].id, stripeProductData);
                    summary.updated++;
                } else {
                    stripeProduct = await stripe.products.create(stripeProductData);
                    summary.created++;
                }

                const existingPrices = await stripe.prices.list({ product: stripeProduct.id, active: true });
                for (const price of existingPrices.data) {
                    await stripe.prices.update(price.id, { active: false });
                }

                const pricePromises: Promise<any>[] = [];
                if (priceModel > 0) {
                    pricePromises.push(stripe.prices.create({ product: stripeProduct.id, unit_amount: priceModel, currency: "eur", nickname: "Fichier 3D", metadata: { type: "model" } }));
                }
                if (pricePrint > 0) {
                    pricePromises.push(stripe.prices.create({ product: stripeProduct.id, unit_amount: pricePrint, currency: "eur", nickname: "Impression 3D", metadata: { type: "print" } }));
                }
                const stripePrices = await Promise.all(pricePromises);

                const productDocRef = db.collection("products").doc(stripeProduct.id);
                await productDocRef.set({ active: true, name: stripeProduct.name, description: stripeProduct.description, images: stripeProduct.images, metadata: { sheetId: productId } });

                const pricesCollectionRef = productDocRef.collection("prices");
                for (const price of stripePrices) {
                    await pricesCollectionRef.doc(price.id).set({ active: price.active, currency: price.currency, description: price.nickname, type: price.type, unit_amount: price.unit_amount, metadata: price.metadata });
                }

            } catch (error: any) {
                summary.errors++;
                summary.errorDetails.push({ id: productId, title: productTitle, error: error.message });
                functions.logger.error(`Error processing product ${productId}:`, error.message);
            }
        }

        functions.logger.info("Synchronization finished.", summary);
        return { success: true, message: "Synchronization complete.", results: summary };

    } catch (error: any) {
        functions.logger.error("Fatal error during synchronization:", error);
        summary.errors++;
        summary.errorDetails.push({ error: `Fatal: ${error.message}` });
        throw new HttpsError('internal', `Synchronization failed: ${error.message}`, { results: summary });
    }
});
// #endregion

