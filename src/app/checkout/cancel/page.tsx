
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-red-100 dark:bg-red-900 rounded-full p-3 w-fit">
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl font-headline mt-4">Paiement Annulé</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Votre session de paiement a été annulée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            Vous n'avez pas été débité. Votre panier a été sauvegardé si vous souhaitez réessayer.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/cart">
                Retourner au panier
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/">
                Continuer le shopping
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
