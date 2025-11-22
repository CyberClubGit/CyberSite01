
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// IMPORTANT: This URL is specific to your Firebase project and the function name.
const SYNC_FUNCTION_URL = "https://us-central1-studio-4815326968-e81ad.cloudfunctions.net/syncProductsFromSheet";

export default function SyncPage() {
  // Redirect to home if in production
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div className="container py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Synchronisation Stripe & Firestore</CardTitle>
          <CardDescription>
            Lancez la synchronisation manuelle des produits depuis le Google Sheet vers Stripe et Firestore.
            Cette page est uniquement disponible en mode développement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <p className="text-center text-muted-foreground">
              Cliquez sur le bouton ci-dessous pour ouvrir l'URL de la fonction de synchronisation dans un nouvel onglet. Le processus peut prendre une à deux minutes. Un message de succès s'affichera dans le nouvel onglet une fois l'opération terminée.
            </p>
            <Button asChild size="lg">
                <Link href={SYNC_FUNCTION_URL} target="_blank">
                    Lancer la synchronisation
                </Link>
            </Button>
             <div className="mt-4 p-4 bg-muted/50 border border-dashed rounded-lg text-sm">
                <p className="font-semibold">Que se passe-t-il lorsque je clique ?</p>
                <p className="text-muted-foreground mt-2">
                    Cela ouvre une URL directe vers la fonction Firebase. La page peut sembler "charger" pendant un long moment. C'est normal. Une fois la synchronisation terminée, un message JSON s'affichera. Vous pouvez ensuite fermer cet onglet et revenir ici.
                </p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
