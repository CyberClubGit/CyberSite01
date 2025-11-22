
'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Server, CheckCircle, XCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SyncPage() {
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [result, setResult] = useState<any>(null);
    const firebaseApp = useFirebaseApp();

    // SECURITY: Redirect to home if in production environment.
    if (process.env.NODE_ENV === 'production') {
        redirect('/');
    }

    const handleSync = async () => {
        setStatus('loading');
        setResult(null);

        try {
            const functions = getFunctions(firebaseApp, 'us-central1');
            const syncProducts = httpsCallable(functions, 'syncProductsFromSheet');
            const response = await syncProducts();
            
            setResult(response.data);
            setStatus('success');
        } catch (error: any) {
            console.error("Firebase function call failed:", error);
            const errorData = {
                code: error.code || 'UNKNOWN',
                message: error.message || 'An unknown error occurred.',
                details: error.details || null
            };
            setResult(errorData);
            setStatus('error');
        }
    };
    
    // Automatically trigger sync on page load for convenience
    useEffect(() => {
        handleSync();
    }, []);

    return (
        <div className="container py-12">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-center">Outil de Synchronisation du Catalogue</CardTitle>
                    <CardDescription className="text-center">
                        Cette page déclenche la synchronisation des produits depuis Google Sheets vers Stripe et Firestore.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex flex-col items-center gap-4">
                       <div className="flex items-center gap-4 p-4 rounded-lg bg-muted w-full justify-center">
                            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
                            <p className="text-lg font-medium">
                                {status === 'idle' && 'Prêt à synchroniser.'}
                                {status === 'loading' && 'Synchronisation en cours...'}
                                {status === 'success' && 'Synchronisation terminée avec succès.'}
                                {status === 'error' && 'Erreur de synchronisation.'}
                            </p>
                       </div>
                        <Button onClick={handleSync} disabled={status === 'loading'}>
                            {status === 'loading' ? (
                                <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                En cours...
                                </>
                            ) : (
                                'Relancer la synchronisation'
                            )}
                        </Button>
                    </div>

                    {result && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Server /> Réponse du serveur :</h3>
                            <pre className="p-4 bg-gray-900 text-white rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                     <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                        <p>💡 <strong>Note:</strong> Cette page est un outil de développement et n'est accessible que sur votre machine locale (`localhost`).</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
