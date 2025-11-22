
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { X, Plus, Minus, Loader2, ShoppingCart, Send } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from "firebase/firestore";

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


export function CartView() {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const auth = useAuth();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendOrder = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      setError("Veuillez vous connecter pour envoyer une commande.");
      router.push('/auth/signin');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fromUserEmail = currentUser.email;
      const htmlBody = formatItemsToHtml(cart);
      const subject = `Nouvelle commande de ${fromUserEmail}`;
      const recipientEmail = "contact@cyber-club.net";

      // Prepare the email document for the "Trigger Email" extension
      const mailDoc = {
        to: recipientEmail,
        replyTo: fromUserEmail,
        message: {
          subject: subject,
          html: htmlBody,
        },
      };

      // Add a new document to the "mail" collection
      await addDoc(collection(db, "mail"), mailDoc);

      clearCart();
      router.push('/checkout/success');

    } catch (err: any) {
      console.error("Error writing to mail collection:", err);
      setError("Erreur lors de la soumission de la commande. Veuillez réessayer.");
    } finally {
        setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <ShoppingCart className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-headline">Votre panier est vide</h3>
        <p className="mt-2">Parcourez le catalogue pour trouver votre bonheur.</p>
      </div>
    );
  }
  
  const formattedTotalPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalPrice / 100);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-6">
        <div className="px-6 py-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                {item.image ? (
                   <Image src={item.image} alt={item.name} fill className="object-cover" />
                ): (
                   <div className="w-full h-full bg-secondary"></div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.price / 100)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span>{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-6 mt-auto">
        <div className="flex justify-between items-center text-lg font-semibold mb-4">
          <span>Total</span>
          <span>{formattedTotalPrice}</span>
        </div>
        <Button className="w-full" size="lg" onClick={handleSendOrder} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Envoyer la commande
            </>
          )}
        </Button>
        {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive text-sm rounded-lg">
                <p className="font-bold">Erreur lors de l'envoi</p>
                <p>{error}</p>
            </div>
        )}
      </div>
    </div>
  );
}
