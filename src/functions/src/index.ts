
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

// Set global options for the region
setGlobalOptions({ region: "us-central1" });

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Safe initialization of Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

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
