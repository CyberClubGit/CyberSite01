
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
import { HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

// Safe initialization of Firebase Admin SDK
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
        <img src="${item.image}" alt="${item.name}" width="50" style="border-radius: 4px; vertical-align: middle;">
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; vertical-align: middle;">
        ${item.name}<br>
        <small style="color: #555;">ID: ${item.id}</small>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; vertical-align: middle;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; vertical-align: middle;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.price / 100)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; vertical-align: middle;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((item.price * item.quantity) / 100)}</td>
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
  functions.logger.info("--- Received new order to send by email using Nodemailer ---");

  // 1. Validate environment variables
  const emailUserName = process.env.EMAIL_USERNAME;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUserName || !emailPassword) {
      functions.logger.error("FATAL: EMAIL_USERNAME or EMAIL_PASSWORD is not set in .env file.");
      throw new HttpsError('internal', 'La configuration du serveur de messagerie est manquante. Contactez l\'administrateur.');
  }

  // 2. Validate cart data
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    functions.logger.error("Validation failed: 'items' is not a non-empty array.", data);
    throw new HttpsError('invalid-argument', 'La fonction doit être appelée avec un tableau "items" non vide.');
  }

  // 3. Validate user authentication
  if (!context.auth) {
      throw new HttpsError('unauthenticated', 'La fonction doit être appelée par un utilisateur authentifié.');
  }

  // 4. Prepare email content
  const fromUserEmail = context.auth.token.email || 'email.non.fourni@exemple.com';
  const htmlBody = formatItemsToHtml(data.items);
  const subject = `Nouvelle commande de ${fromUserEmail}`;
  const recipientEmail = "contact@cyber-club.net";

  // 5. Configure Nodemailer transporter using Gmail
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: emailUserName,
          pass: emailPassword,
      },
  });

  const mailOptions = {
      from: `CYBER CLUB <${emailUserName}>`, // Sender address
      to: recipientEmail, // List of receivers
      subject: subject, // Subject line
      html: htmlBody, // HTML body
  };

  // 6. Send the email
  try {
      functions.logger.info(`Attempting to send email to '${recipientEmail}'...`);
      await transporter.sendMail(mailOptions);
      functions.logger.info(`Successfully sent order email to ${recipientEmail}`, { fromUserEmail });
      return { success: true, message: `Commande envoyée avec succès à ${recipientEmail}.` };
  } catch (error: any) {
      functions.logger.error("CRITICAL: Nodemailer failed to send email.", {
          errorMessage: error.message,
          errorStack: error.stack,
          dataReceived: data,
      });
      // Provide a clear error message back to the client
      throw new HttpsError('internal', `Échec de l'envoi de l'e-mail. Cause: ${error.message}`);
  }
});

// #endregion


// This is kept for reference, but can be removed if Stripe integration is abandoned.
export const syncProductsFromSheet = functions.https.onCall(async (data, context) => {
    functions.logger.warn("syncProductsFromSheet was called, but is deprecated.");
    return { success: true, message: "This function is deprecated." };
});
