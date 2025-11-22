
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// This must match the secret in your environment variables
const SYNC_SECRET = process.env.NEXT_PUBLIC_SYNC_SECRET || "SUPER_SECRET_SYNC_KEY";
const SYNC_FUNCTION_URL = "https://us-central1-studio-4815326968-e81ad.cloudfunctions.net/syncProductsFromSheet";

type SyncStatus = 'idle' | 'unauthorized' | 'syncing' | 'success' | 'error';
type SyncResult = {
    success: boolean;
    message: string;
    results?: any;
}

export default function SyncPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    const secret = searchParams.get('secret');

    if (secret !== SYNC_SECRET) {
      setStatus('unauthorized');
      return;
    }

    const startSync = async () => {
      setStatus('syncing');
      try {
        const response = await fetch(SYNC_FUNCTION_URL, { method: 'GET' });
        const data: SyncResult = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
        } else {
          setStatus('error');
        }
        setResult(data);

      } catch (err: any) {
        setStatus('error');
        setResult({ success: false, message: err.message || "An unknown network error occurred." });
      }
    };

    startSync();
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case 'syncing':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Synchronisation en cours...</p>
            <p className="text-muted-foreground">Veuillez ne pas fermer cette page. Cela peut prendre une à deux minutes.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold">Synchronisation terminée avec succès !</p>
            <p className="text-muted-foreground">{result?.message}</p>
            <pre className="mt-4 w-full max-w-2xl bg-muted p-4 rounded-lg text-left text-xs overflow-auto max-h-96">
                {JSON.stringify(result?.results, null, 2)}
            </pre>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-semibold text-destructive">Erreur de synchronisation</p>
            <p className="text-muted-foreground">{result?.message || 'Une erreur inconnue est survenue.'}</p>
             <pre className="mt-4 w-full max-w-2xl bg-destructive/10 text-destructive-foreground p-4 rounded-lg text-left text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
      case 'unauthorized':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-semibold text-destructive">Accès non autorisé</p>
            <p className="text-muted-foreground">La clé secrète est manquante ou incorrecte.</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Initialisation...</p>
          </div>
        );
    }
  };

  return (
    <div className="container py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Synchronisation des Produits</CardTitle>
          <CardDescription className="text-center">
            Synchronisation des données du Google Sheet vers Stripe et Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
