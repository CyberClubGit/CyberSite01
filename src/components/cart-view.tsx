
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';

export function CartView() {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firebaseApp = useFirebaseApp();

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions(firebaseApp, 'us-central1');
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const items = cart.map(item => ({ id: item.id, quantity: item.quantity }));
      
      const result: any = await createCheckoutSession({ items });
      const checkoutUrl = result.data.url;
      
      // Redirect to Stripe checkout page
      window.location.href = checkoutUrl;

    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      setError(err.message || "Impossible de démarrer le paiement. Veuillez réessayer.");
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
  
  const formattedTotalPrice = (totalPrice / 100).toFixed(2).replace('.', ',');
  const dataToSend = cart.map(item => ({ id: item.id, quantity: item.quantity }));

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
                  {(item.price / 100).toFixed(2).replace('.', ',')} €
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
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        <div className="flex justify-between items-center text-lg font-semibold mb-4">
          <span>Total</span>
          <span>{formattedTotalPrice} €</span>
        </div>
        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            'Procéder au paiement'
          )}
        </Button>
        
        {/* --- DEBUG BOX --- */}
        {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 border bg-muted/50 rounded-lg text-xs">
                <h4 className="font-bold text-center mb-2">Debug Info</h4>
                <p className="font-semibold">Data sent to function:</p>
                <pre className="whitespace-pre-wrap break-all bg-background/50 p-1 rounded">
                    <code>{JSON.stringify(dataToSend, null, 2)}</code>
                </pre>
                <p className="font-semibold mt-2">Full cart state:</p>
                <pre className="whitespace-pre-wrap break-all bg-background/50 p-1 rounded max-h-40 overflow-auto">
                    <code>{JSON.stringify(cart, null, 2)}</code>
                </pre>
            </div>
        )}
        {/* --- END DEBUG BOX --- */}

      </div>
    </div>
  );
}

// Dummy icon for when CartView is imported elsewhere
const ShoppingCart = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>
);
