
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


// #region --- New Email Order Function ---

/**
 * Formats cart items into an HTML string for an email.
 */
function formatItemsToHtml(items: any[]): string {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">
        <img src="${item.image}" alt="${item.name}" width="50" style="border-radius: 4px;">
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">
        ${item.name}<br>
        <small style="color: #555;">ID: ${item.id}</small>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.price / 100)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((item.price * item.quantity) / 100)}</td>
    </tr>
  `).join('');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return `
    <p>Une nouvelle commande a été passée.</p>
    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
      <thead>
        <tr>
          <th style="padding: 8px; border-bottom: 2px solid #333; text-align: left;" colspan="2">Produit</th>
          <th style="padding: 8px; border-bottom: 2px solid #333; text-align: center;">Quantité</th>
          <th style="padding: 8px; border-bottom: 2px solid #333; text-align: right;">Prix Unitaire</th>
          <th style="padding: 8px; border-bottom: 2px solid #333; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding: 12px 8px 0; text-align: right; font-weight: bold;">Total de la commande :</td>
          <td style="padding: 12px 8px 0; text-align: right; font-weight: bold;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total / 100)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}


export const sendOrderEmail = functions.https.onCall(async (data, context) => {
  functions.logger.info("--- Received new order to send by email ---");

  // Validate cart data
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpsError('invalid-argument', 'La fonction doit être appelée avec un tableau "items" non vide.');
  }

  const userEmail = context.auth?.token?.email || 'email.non.fourni@exemple.com';
  const htmlBody = formatItemsToHtml(data.items);
  const subject = `Nouvelle commande de ${userEmail}`;
  const recipientEmail = "contact@cyber-club.net"; // **IMPORTANT**: Replace with the actual recipient email address

  const mailEntry = {
    to: [recipientEmail],
    message: {
      subject: subject,
      html: htmlBody,
    },
  };

  try {
    // This writes the email to the 'mail' collection.
    // The "Trigger Email" Firebase Extension must be installed to process this queue.
    await db.collection('mail').add(mailEntry);
    functions.logger.info(`Successfully queued order email to ${recipientEmail}`, { userEmail });
    return { success: true, message: `Commande envoyée avec succès à ${recipientEmail}.` };
  } catch (error: any) {
    functions.logger.error("Failed to queue email:", error);
    throw new HttpsError('internal', `Une erreur est survenue lors de l'envoi de la commande.`);
  }
});

// #endregion


// #region --- Sync Function (for reference, but can be removed) ---
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
    functions.logger.info("--- Starting Product Synchronization ---", {
      invokedBy: context.auth?.uid || "anonymous",
    });

    let stripe: Stripe;
    try {
        const key = stripeSecretKey.value();
        if (!key) {
            throw new Error("Stripe secret key is not available in environment.");
        }
        stripe = new Stripe(key, { apiVersion: "2024-06-20" });
        functions.logger.info("Stripe SDK initialized successfully.");
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
                functions.logger.warn(`Skipping product '${productTitle}' (ID: ${productId}) - No valid price.`);
                summary.skipped++;
                continue;
            }
            
            functions.logger.info(`Processing product: ${productTitle} (ID: ${productId})`);

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
                const existingId = existingProducts.data[0].id;
                functions.logger.info(`Product with sheet_id '${productId}' already exists in Stripe (Stripe ID: ${existingId}). Updating...`);
                stripeProduct = await stripe.products.update(existingId, stripeProductData);
                summary.updated++;
            } else {
                functions.logger.info(`Product with sheet_id '${productId}' not found in Stripe. Creating new product...`);
                stripeProduct = await stripe.products.create(stripeProductData);
                summary.created++;
            }

            const existingPrices = await stripe.prices.list({ product: stripeProduct.id, active: true });
            for (const price of existingPrices.data) {
                await stripe.prices.update(price.id, { active: false });
            }
            functions.logger.info(`Deactivated ${existingPrices.data.length} old prices for ${productId}.`);

            const pricePromises: Promise<any>[] = [];
            if (priceModel > 0) {
                pricePromises.push(stripe.prices.create({ product: stripeProduct.id, unit_amount: priceModel, currency: "eur", nickname: "Fichier 3D", metadata: { type: "model" } }));
            }
            if (pricePrint > 0) {
                pricePromises.push(stripe.prices.create({ product: stripeProduct.id, unit_amount: pricePrint, currency: "eur", nickname: "Impression 3D", metadata: { type: "print" } }));
            }
            const stripePrices = await Promise.all(pricePromises);
            functions.logger.info(`Created ${stripePrices.length} new prices for ${productId}.`);

            const productDocRef = db.collection("products").doc(stripeProduct.id);
            await productDocRef.set({ active: true, name: stripeProduct.name, description: stripeProduct.description, images: stripeProduct.images, metadata: { sheetId: productId } });

            const pricesCollectionRef = productDocRef.collection("prices");
            for (const price of stripePrices) {
                await pricesCollectionRef.doc(price.id).set({ active: price.active, currency: price.currency, description: price.nickname, type: price.type, unit_amount: price.unit_amount, metadata: price.metadata });
            }
            functions.logger.info(`Product ${productId} successfully synced to Firestore.`);

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
