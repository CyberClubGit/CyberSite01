
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SYNC_FUNCTION_URL = "https://us-central1-studio-4815326968-e81ad.cloudfunctions.net/syncProductsFromSheet";

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
type SyncResult = {
    success: boolean;
    message: string;
    results?: any;
}

export default function SyncPage() {
    // SECURITY: Redirect to home if in production environment.
    if (process.env.NODE_ENV === 'production') {
        redirect('/');
    }

    const [status, setStatus] = useState<SyncStatus>('idle');
    const [result, setResult] = useState<SyncResult | null>(null);

    const startSync = async () => {
        setStatus('syncing');
        setResult(null);
        try {
            const response = await fetch(SYNC_FUNCTION_URL, { 
                method: 'GET',
                mode: 'cors', // Important for local development
            });
            const data: SyncResult = await response.json();
            
            if (response.ok && data.success) {
                setStatus('success');
            } else {
                setStatus('error');
            }
            setResult(data);

        } catch (err: any) {
            setStatus('error');
            setResult({ success: false, message: err.message || "An unknown network error occurred. Check browser console for CORS issues or if the function is deployed." });
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'syncing':
                return (
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-lg font-semibold">Synchronisation en cours...</p>
                        <p className="text-muted-foreground">Veuillez patienter. Cela peut prendre une à deux minutes.</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="mt-4 text-lg font-semibold">Synchronisation terminée avec succès !</p>
                        <p className="text-muted-foreground">{result?.message}</p>
                        <pre className="mt-4 w-full text-left text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                            {JSON.stringify(result?.results, null, 2)}
                        </pre>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center">
                        <XCircle className="h-12 w-12 text-destructive mx-auto" />
                        <p className="mt-4 text-lg font-semibold text-destructive">Erreur de synchronisation</p>
                        <p className="mt-2 text-muted-foreground">L'opération a échoué. Voici les détails :</p>
                        <pre className="mt-4 w-full text-left text-xs bg-destructive/10 text-destructive-foreground p-4 rounded-lg overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                );
            case 'idle':
                return (
                    <div className="text-center">
                         <div className="mb-8">
                             <Button onClick={startSync} size="lg">
                                Lancer la synchronisation
                            </Button>
                         </div>
                        <p className="text-muted-foreground">Cliquez sur le bouton pour lancer la synchronisation manuelle des produits.</p>
                    </div>
                );
            default:
                return null;
        }
    };
  
    return (
        <div className="container py-12">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-center">Synchronisation des Produits (Debug)</CardTitle>
                    <CardDescription className="text-center">
                        Outil de développement pour synchroniser les données du Google Sheet vers Stripe et Firestore.
                    </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px] flex items-center justify-center p-8">
                    {renderContent()}
                </CardContent>
            </Card>

            <Card className="max-w-4xl mx-auto mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500"/> Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <p>Cette page est accessible uniquement en mode développement local (`npm run dev`).</p>
                    <div>
                        <p className="font-semibold">URL de la fonction appelée :</p>
                        <code className="text-xs bg-muted p-2 rounded-md block mt-1">{SYNC_FUNCTION_URL}</code>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
