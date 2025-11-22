
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
import { defineSecret } from "firebase-functions/params";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize Stripe with secret key - lazily
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
      apiVersion: "2025-11-17.clover",
    });
  }
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=928586250&single=true&output=csv";

// #region Fonctions utilitaires
/**
 * Nettoie une chaîne de prix et la convertit en centimes.
 * @param {string} priceStr - La chaîne de prix (ex: "22,4" ou "10.00").
 * @return {number} Le prix en centimes, ou 0 si invalide.
 */
function cleanPrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === "") return 0;
  const cleaned = priceStr.replace(",", ".");
  const price = parseFloat(cleaned);
  if (isNaN(price)) return 0;
  return Math.round(price * 100); // Convertir en centimes
}

/**
 * Extrait la première URL d'image d'une chaîne contenant plusieurs URLs.
 * @param {string} galleryStr - La chaîne contenant des URLs séparées par des sauts de ligne.
 * @return {string | null} La première URL valide, ou null.
 */
function getFirstImage(galleryStr: string): string | null {
  if (!galleryStr || galleryStr.trim() === "") return null;
  const images = galleryStr.split(/[\r\n]+/).filter((url) => url.trim() !== "");
  if (images.length === 0) return null;
  return images[0].trim();
}
// #endregion

export const syncProductsFromSheet = functions.runWith({secrets: [stripeSecretKey]}).region("us-central1").https.onRequest(async (req, res) => {
  functions.logger.info("Starting product synchronization from Google Sheet.", {structuredData: true});
  
  ensureStripeIsInitialized();

  const summary = {
    success: [] as string[],
    skipped: [] as string[],
    errors: [] as {id: string, error: string}[],
  };

  try {
    // 1. Récupérer le CSV depuis Google Sheets
    functions.logger.log("Fetching CSV from Google Sheet...");
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }
    const csvText = await response.text();
    functions.logger.log("CSV fetched successfully.");

    // 2. Parser le CSV
    const parsed = Papa.parse(csvText, {header: true, skipEmptyLines: true});
    const products = parsed.data as any[];
    functions.logger.log(`Parsed ${products.length} products from CSV.`);

    // 3. Traiter chaque produit
    for (const product of products) {
      const productId = product.ID?.trim();
      const productTitle = product.Title?.trim();

      // Validation de base
      if (!productId || !productTitle) {
        summary.skipped.push(`Product with missing ID or Title: ${JSON.stringify(product)}`);
        continue;
      }

      const priceModel = cleanPrice(product.Price_Model);
      const pricePrint = cleanPrice(product.Price_Print);

      if (priceModel === 0 && pricePrint === 0) {
        summary.skipped.push(`${productTitle} (ID: ${productId}) - No valid price.`);
        continue;
      }

      try {
        // 4. Créer ou mettre à jour les produits dans Stripe
        functions.logger.log(`Processing Stripe product: ${productTitle} (ID: ${productId})`);
        const firstImage = getFirstImage(product.Gallery);

        const stripeProductData = {
            name: productTitle,
            description: product.Description,
            images: firstImage ? [firstImage] : [],
            active: true,
            metadata: {
                type: product.Type,
                style: product.Style,
                material: product.Material,
                activity: product.Activity,
                stl_url: product.Stl,
                sheet_id: productId, // ** IMPORTANT: This is the link to the Google Sheet ID **
            },
        };

        const stripeProduct = await stripe.products.create({
          id: productId,
          ...stripeProductData
        }).catch(async (error: any) => {
          if (error.code === "resource_already_exists") {
            functions.logger.log(`Product ${productId} already exists in Stripe, updating...`);
            return await stripe.products.update(productId, stripeProductData);
          }
          throw error; 
        });
        
        const existingPrices = await stripe.prices.list({ product: stripeProduct.id, active: true });
        for (const price of existingPrices.data) {
            await stripe.prices.update(price.id, { active: false });
        }
        
        const pricePromises: Promise<any>[] = [];

        if (priceModel > 0) {
          pricePromises.push(stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceModel,
            currency: "eur",
            nickname: "Fichier 3D",
            metadata: {type: "model"},
          }));
        }

        if (pricePrint > 0) {
          pricePromises.push(stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: pricePrint,
            currency: "eur",
            nickname: "Impression 3D",
            metadata: {type: "print"},
          }));
        }

        const stripePrices = await Promise.all(pricePromises);
        functions.logger.log(`Created ${stripePrices.length} new prices for ${productId} in Stripe.`);

        // 5. Synchroniser avec Firestore
        functions.logger.log(`Syncing product ${productId} to Firestore.`);
        const productDocRef = db.collection("products").doc(stripeProduct.id);

        await productDocRef.set({
          active: true,
          name: stripeProduct.name,
          description: stripeProduct.description,
          images: stripeProduct.images,
          type: product.Type,
          style: product.Style,
          material: product.Material,
          activity: product.Activity,
          metadata: {
            sheetId: productId,
            stl_url: product.Stl,
          },
        });

        const pricesCollectionRef = productDocRef.collection("prices");
        for (const price of stripePrices) {
          await pricesCollectionRef.doc(price.id).set({
            active: price.active,
            currency: price.currency,
            description: price.nickname,
            type: price.type,
            unit_amount: price.unit_amount,
            metadata: price.metadata,
          });
        }
        functions.logger.log(`Product ${productId} successfully synced to Firestore.`);
        summary.success.push(productTitle);
      } catch (error: any) {
        functions.logger.error(`Error processing product ${productId}:`, error.message);
        summary.errors.push({id: productId, error: error.message});
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
      results: summary,
    });
  }
});


export const createCheckoutSession = functions.runWith({ secrets: [stripeSecretKey] }).region('us-central1').https.onCall(async (data, context) => {
  ensureStripeIsInitialized();

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an array of "items".');
  }

  const line_items = [];

  for (const item of data.items) {
    if (!item.id || !item.quantity || item.id.includes('#NAME?')) {
        functions.logger.warn(`Invalid or missing ID for item in cart: ${item.id}. Skipping.`);
        continue;
    }
    
    // ** THE FIX IS HERE: Search Stripe product by the sheet_id in metadata **
    const products = await stripe.products.search({
      query: `metadata['sheet_id']:'${item.id}'`,
      limit: 1,
    });

    if (products.data.length === 0) {
        functions.logger.error(`No Stripe product found for sheet ID: ${item.id}`);
        throw new functions.https.HttpsError('not-found', `Product with ID '${item.id}' not found. It may not be synchronized with our payment system.`);
    }
    const stripeProduct = products.data[0];
    
    // Now find its active price.
    const prices = await stripe.prices.list({
        product: stripeProduct.id,
        active: true,
        limit: 1, 
    });

    if (prices.data.length === 0) {
        functions.logger.error(`No active price found for Stripe product ID: ${stripeProduct.id}`);
        throw new functions.https.HttpsError('not-found', `A price for '${stripeProduct.name}' could not be found. Please contact support.`);
    }

    line_items.push({
      price: prices.data[0].id,
      quantity: item.quantity,
    });
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

    