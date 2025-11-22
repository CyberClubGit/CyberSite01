
'use client';

import { useState } from 'react';
import { useCart, CartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { X, Plus, Minus, Loader2, ShoppingCart, Send } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

export function CartView() {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firebaseApp = useFirebaseApp();
  const router = useRouter();

  const handleSendOrder = async () => {
    if (!user) {
      setError("Veuillez vous connecter pour envoyer une commande.");
      router.push('/auth/signin');
      return;
    }
    
    setLoading(true);
    setError(null);

    const items = cart.map(item => ({ 
      id: item.id, 
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity 
    }));
    
    try {
      const functions = getFunctions(firebaseApp, 'us-central1');
      const sendOrderEmail = httpsCallable(functions, 'sendOrderEmail');
      
      const result: any = await sendOrderEmail({ items });
      
      if (result.data.success) {
        alert("Commande envoyée avec succès !");
        clearCart();
      } else {
        throw new Error(result.data.message || "Une erreur inconnue est survenue.");
      }

    } catch (err: any) {
      console.error("Error sending order email:", err);
      const errorMessage = err.details?.message || err.message || "Une erreur inconnue est survenue.";
      setError(errorMessage);
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
