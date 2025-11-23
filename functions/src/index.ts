
// This file is intentionally left empty.
// All server-side logic has been removed in favor of direct client-to-Firestore operations
// for submitting orders, which simplifies the architecture and removes a point of failure.

/**
 * DEPRECATED: This function is no longer in use.
 * The Stripe and Firestore product synchronization has been disabled.
 * The catalog now sources its data directly from Google Sheets.
 *
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { defineSecret, setGlobalOptions } from "firebase-functions/params";

// Set global options for the region
setGlobalOptions({ region: "us-central1" });

// Safe initialization of Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=928586250&single=true&output=csv";

// Deprecated function to sync products
export const syncProductsFromSheet = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
    functions.logger.warn("DEPRECATED: syncProductsFromSheet was called, but is no longer active.");
    return { success: true, message: "This function is deprecated and has been disabled." };
});

*/
