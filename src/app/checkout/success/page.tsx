
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl font-headline mt-4">Commande Envoyée !</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Merci pour votre commande.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            Votre commande a été transmise. Nous vous contacterons bientôt.
          </p>
          <Button asChild size="lg">
            <Link href="/">
              Retourner à l'accueil
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
