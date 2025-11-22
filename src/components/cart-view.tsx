
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { X, Plus, Minus, Loader2, ShoppingCart } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';

// This is a new component for the debug box
const DebugInfoBox = ({ loading, error, dataSent }: { loading: boolean; error: string | null; dataSent: any }) => {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="mt-4 p-4 bg-muted/50 border border-dashed rounded-lg text-sm">
            <h4 className="font-bold font-mono">Debug Info</h4>
            <div className="mt-2 space-y-2">
                <p>Status: {loading ? 'Loading...' : error ? 'Error' : 'Idle'}</p>
                {dataSent && (
                    <div>
                        <p className="font-semibold">Data sent to function:</p>
                        <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto">
                            {JSON.stringify(dataSent, null, 2)}
                        </pre>
                    </div>
                )}
                {error && (
                    <div>
                        <p className="font-semibold text-destructive">Error received:</p>
                        <pre className="text-xs bg-background p-2 rounded-md text-destructive">
                            {error}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};


export function CartView() {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSent, setDataSent] = useState<any>(null); // State to hold data for debug box
  const firebaseApp = useFirebaseApp();

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    setDataSent(null);

    try {
      const functions = getFunctions(firebaseApp, 'us-central1');
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const items = cart.map(item => ({ 
        id: item.id, 
        quantity: item.quantity 
      }));

      // Store the data being sent for debugging purposes
      setDataSent(items);
      
      const result: any = await createCheckoutSession({ items });
      
      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error("The payment URL was not received from the server.");
      }

    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      // More descriptive error handling
      const errorMessage = err.details?.message || err.message || "An unknown error occurred. Please try again.";
      setError(errorMessage);
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
        <DebugInfoBox loading={loading} error={error} dataSent={dataSent} />
      </div>
    </div>
  );
}
