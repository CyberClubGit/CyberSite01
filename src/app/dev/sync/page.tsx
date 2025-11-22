
'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { redirect } from 'next/navigation';

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const firebaseApp = useFirebaseApp();

  // Redirect to home if in production
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const functions = getFunctions(firebaseApp, 'us-central1');
      const syncProducts = httpsCallable(functions, 'syncProductsFromSheet');
      const response = await syncProducts();
      setResult(response.data);
    } catch (err: any) {
      console.error("Error calling sync function:", err);
      setError(err.message || "An unknown error occurred during synchronization.");
    } finally {
      setLoading(false);
    }
  };

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
              Cliquez sur le bouton ci-dessous pour démarrer le processus. Cela peut prendre une à deux minutes en fonction du nombre de produits à traiter.
            </p>
            <Button onClick={handleSync} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                'Lancer la synchronisation'
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <div>
                  <h4 className="font-bold text-destructive">Erreur de synchronisation</h4>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                        <h4 className="font-bold text-green-700 dark:text-green-400">Synchronisation terminée</h4>
                        <p className="text-sm text-green-600/80 dark:text-green-500/80">{result.message}</p>
                    </div>
                </div>
              <ScrollArea className="max-h-96 w-full rounded-md border bg-background p-4">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(result.results, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
