
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

// Using require for CJS compatibility
const fetch = require("node-fetch");
const Papa = require("papaparse");

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
  functions.logger.info("Ensuring Stripe is initialized...");
  if (!stripe) {
    const key = stripeSecretKey.value();
    if (!key) {
      functions.logger.error("CRITICAL: STRIPE_SECRET_KEY is not defined in secret manager.");
      throw new HttpsError('internal', 'La clé secrète Stripe n\'est pas configurée sur le serveur.');
    }
    functions.logger.info(`Stripe key loaded successfully (last 4 chars: ...${key.slice(-4)}).`);
    stripe = new Stripe(key, {
      apiVersion: "2024-06-20",
    });
    functions.logger.info("Stripe SDK initialized.");
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

export const syncProductsFromSheet = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
    functions.logger.info("--- Starting Product Synchronization ---");

    try {
        ensureStripeIsInitialized();
    } catch (error: any) {
        functions.logger.error("FATAL: Stripe initialization failed.", { error: error.message });
        throw new HttpsError('internal', `Stripe initialization failed: ${error.message}`);
    }

    const summary = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        errorDetails: [] as { id?: string, title?: string, error: string }[],
    };

    let csvText: string;
    try {
        functions.logger.info(`Fetching CSV from: ${SHEET_URL}`);
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
        }
        csvText = await response.text();
        functions.logger.info("CSV fetched successfully.");
    } catch (error: any) {
        functions.logger.error("FATAL: Could not fetch Google Sheet.", { error: error.message });
        throw new HttpsError('internal', `Could not fetch Google Sheet: ${error.message}`);
    }
    
    let products: any[];
    try {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        products = parsed.data as any[];
        summary.processed = products.length;
        functions.logger.info(`Parsed ${products.length} products from CSV.`);
    } catch (error: any) {
        functions.logger.error("FATAL: Could not parse CSV data.", { error: error.message });
        throw new HttpsError('internal', `Could not parse CSV: ${error.message}`);
    }

    for (const product of products) {
        const productId = product.ID?.trim();
        const productTitle = product.Title?.trim();

        try {
            if (!productId || !productTitle || productId.includes('#NAME?')) {
                throw new Error("Missing or invalid ID/Title in sheet row.");
            }

            const priceModel = cleanPrice(product.Price_Model);
            const pricePrint = cleanPrice(product.Price_Print);

            if (priceModel === 0 && pricePrint === 0) {
                summary.skipped++;
                continue;
            }

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
            const errorMessage = `Error processing product ID '${productId}' (Title: '${productTitle}'): ${error.message}`;
            summary.errorDetails.push({ id: productId, title: productTitle, error: error.message });
            functions.logger.error(errorMessage, { rawError: error });
        }
    }

    functions.logger.info("--- Synchronization Finished ---", { summary });
    
    if (summary.errors > 0) {
        throw new HttpsError('internal', `Synchronization finished with ${summary.errors} errors. Check function logs for details.`, { results: summary });
    }

    return { success: true, message: "Synchronization complete.", results: summary };
});
// #endregion

    