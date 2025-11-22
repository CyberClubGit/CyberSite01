
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProductsFromSheet = exports.sendOrderEmail = void 0;
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
const nodemailer = __importStar(require("nodemailer"));
// Set global options for the region
(0, params_1.setGlobalOptions)({ region: "us-central1" });
// Safe initialization of Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Define secrets for email credentials
const emailUserName = (0, params_1.defineSecret)("EMAIL_USERNAME");
const emailPassword = (0, params_1.defineSecret)("EMAIL_PASSWORD");
// #region --- New Email Order Function ---
/**
 * Formats cart items into an HTML string for an email.
 */
function formatItemsToHtml(items) {
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
exports.sendOrderEmail = functions.runWith({ secrets: [emailUserName, emailPassword] }).https.onCall(async (data, context) => {
    functions.logger.info("--- Received new order to send by email using Nodemailer ---");
    // 1. Validate cart data
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        functions.logger.error("Validation failed: 'items' is not a non-empty array.", data);
        throw new https_1.HttpsError('invalid-argument', 'La fonction doit être appelée avec un tableau "items" non vide.');
    }
    // 2. Validate user authentication
    if (!context.auth) {
        throw new https_1.HttpsError('unauthenticated', 'La fonction doit être appelée par un utilisateur authentifié.');
    }
    // 3. Prepare email content
    const fromUserEmail = context.auth.token.email || 'email.non.fourni@exemple.com';
    const htmlBody = formatItemsToHtml(data.items);
    const subject = `Nouvelle commande de ${fromUserEmail}`;
    const recipientEmail = "contact@cyber-club.net";
    // 4. Configure Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUserName.value(),
            pass: emailPassword.value(),
        },
    });
    const mailOptions = {
        from: `CYBER CLUB <${emailUserName.value()}>`, // Sender address
        to: recipientEmail, // List of receivers
        subject: subject, // Subject line
        html: htmlBody, // HTML body
    };
    // 5. Send the email
    try {
        functions.logger.info(`Attempting to send email to '${recipientEmail}'...`);
        await transporter.sendMail(mailOptions);
        functions.logger.info(`Successfully sent order email to ${recipientEmail}`, { fromUserEmail });
        return { success: true, message: `Commande envoyée avec succès à ${recipientEmail}.` };
    }
    catch (error) {
        functions.logger.error("CRITICAL: Nodemailer failed to send email.", {
            errorMessage: error.message,
            errorStack: error.stack,
            dataReceived: data,
        });
        // Provide a clear error message back to the client
        throw new https_1.HttpsError('internal', `Échec de l'envoi de l'e-mail. Cause: ${error.message}`);
    }
});
// #endregion
// This is kept for reference, but can be removed if Stripe integration is abandoned.
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=928586250&single=true&output=csv";
exports.syncProductsFromSheet = functions.runWith({ secrets: [stripeSecretKey] }).https.onCall(async (data, context) => {
    functions.logger.warn("syncProductsFromSheet was called, but is deprecated.");
    return { success: true, message: "This function is deprecated." };
});
//# sourceMappingURL=index.js.map

