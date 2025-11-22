
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
      throw new HttpsError('internal', 'Stripe secret key is not configured on the server.');
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
    throw new HttpsError('invalid-argument', 'The function must be called with an array of "items".');
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of data.items) {
    // Validate each item with explicit reasons for failure
    if (!item.id || typeof item.id !== 'string') {
        const errorMsg = `Invalid item found in cart: ID is missing or not a string. Item: ${JSON.stringify(item)}`;
        functions.logger.error(errorMsg);
        throw new HttpsError('invalid-argument', errorMsg);
    }
    if (!item.name) {
        const errorMsg = `Invalid item found in cart: Name is missing. Item ID: ${item.id}`;
        functions.logger.error(errorMsg);
        throw new HttpsError('invalid-argument', errorMsg);
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
        const errorMsg = `Invalid item found in cart: '${item.name}'. Price must be a positive number (in cents), but received '${item.price}'.`;
        functions.logger.error(errorMsg);
        throw new HttpsError('invalid-argument', errorMsg);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        const errorMsg = `Invalid item found in cart: '${item.name}'. Quantity must be a positive number, but received '${item.quantity}'.`;
        functions.logger.error(errorMsg);
        throw new HttpsError('invalid-argument', errorMsg);
    }


    try {
      // Create a temporary product and price in Stripe for this transaction
      const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: item.price, // Price is already in cents from the frontend
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            sheet_id: item.id
          }
        }
      });
      
      line_items.push({
        price: price.id,
        quantity: item.quantity,
      });

    } catch (error: any) {
       functions.logger.error(`Failed to create Stripe price for item ${item.id}:`, error);
       throw new HttpsError('internal', `An error occurred while processing item ${item.name}.`);
    }
  }

  if (line_items.length === 0) {
    throw new HttpsError('failed-precondition', 'No valid items were processed to create a checkout session.');
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
      throw new HttpsError('internal', 'Could not create a checkout session URL.');
    }

    return { url: session.url };

  } catch (error: any) {
    functions.logger.error('Stripe checkout session creation failed:', error);
    throw new HttpsError('internal', `Stripe error: ${error.message}`);
  }
});

// The sync function is no longer needed for the checkout flow,
// but it is kept here for potential future administrative use.
// It is not publicly invokable by default anymore.
export const syncProductsFromSheet = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onRequest(async (req, res) => {
    res.status(403).send('This function is disabled for manual execution.');
  });
