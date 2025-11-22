
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
import { defineSecret, setGlobalOptions } from "firebase-functions/params";
import { HttpsError } from "firebase-functions/v2/https";

// Set global options for the region
setGlobalOptions({ region: "us-central1" });

// Safe initialization of Firebase Admin SDK
// This ensures it's initialized only once per instance.
if (admin.apps.length === 0) {
  admin.initializeApp();
}


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

  // Validate cart data first
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    functions.logger.error("Validation failed: 'items' is not a non-empty array.", data);
    throw new HttpsError('invalid-argument', 'La fonction doit être appelée avec un tableau "items" non vide.');
  }

  try {
    // Get a Firestore instance inside the function call for robustness
    const db = admin.firestore();

    const userEmail = context.auth?.token?.email || 'email.non.fourni@exemple.com';
    const htmlBody = formatItemsToHtml(data.items);
    const subject = `Nouvelle commande de ${userEmail}`;
    const recipientEmail = "contact@cyber-club.net";

    const mailEntry = {
      to: [recipientEmail],
      message: {
        subject: subject,
        html: htmlBody,
      },
    };
    
    functions.logger.info(`Attempting to queue email to '${recipientEmail}'...`);
    
    // This writes the email to the 'mail' collection.
    // The "Trigger Email" Firebase Extension must be installed to process this queue.
    await db.collection('mail').add(mailEntry);
    
    functions.logger.info(`Successfully queued order email to ${recipientEmail}`, { userEmail });
    return { success: true, message: `Commande envoyée avec succès à ${recipientEmail}.` };
    
  } catch (error: any) {
    // This will catch any errors during the database write or any other logic
    functions.logger.error("CRITICAL: A fatal error occurred in sendOrderEmail.", {
        errorMessage: error.message,
        errorDetails: error,
        dataReceived: data, // Log the data that caused the error
    });
    
    // Send a specific, helpful error message back to the client.
    throw new HttpsError('internal', `Une erreur est survenue lors de la mise en file de l'e-mail. Cause: ${error.message}`);
  }
});

// #endregion


// This is kept for reference, but can be removed if Stripe integration is abandoned.
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=928586250&single=true&output=csv";
export const syncProductsFromSheet = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
    functions.logger.warn("syncProductsFromSheet was called, but is deprecated.");
    return { success: true, message: "This function is deprecated." };
});

