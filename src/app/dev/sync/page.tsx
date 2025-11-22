
'use client';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// URL de la fonction de synchronisation. Remplacez par l'URL de votre fonction déployée.
const SYNC_FUNCTION_URL = "https://us-central1-studio-4815326968-e81ad.cloudfunctions.net/syncProductsFromSheet";

export default function SyncPage() {
    // SECURITY: Redirect to home if in production environment.
    if (process.env.NODE_ENV === 'production') {
        redirect('/');
    }
  
    return (
        <div className="container py-12">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-center">Guide de Synchronisation des Produits</CardTitle>
                    <CardDescription className="text-center">
                        Comment lancer la synchronisation manuelle des produits depuis le Google Sheet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Étape 1 : Déployer les Fonctions</h3>
                        <p className="text-muted-foreground mb-4">
                            Avant de pouvoir lancer la synchronisation, assurez-vous que la dernière version de vos fonctions Firebase est bien déployée. Exécutez la commande suivante dans votre terminal :
                        </p>
                        <code className="text-sm bg-muted p-3 rounded-md block font-mono">firebase deploy --only functions</code>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Étape 2 : Lancer la Synchronisation</h3>
                        <p className="text-muted-foreground mb-4">
                            Une fois le déploiement terminé, cliquez sur le lien ci-dessous pour démarrer le processus. Un nouvel onglet s'ouvrira et affichera le résultat de l'opération.
                        </p>
                        <Link href={SYNC_FUNCTION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                           <ExternalLink className="mr-2 h-4 w-4" />
                            Lancer la Synchronisation
                        </Link>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Étape 3 : Vérifier le Résultat</h3>
                         <p className="text-muted-foreground">
                            La page qui s'ouvrira affichera un message de succès ou d'erreur.
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
                            <li><span className="font-semibold text-green-600">En cas de succès :</span> Vous verrez un résumé des produits créés, mis à jour ou ignorés.</li>
                            <li><span className="font-semibold text-red-600">En cas d'erreur :</span> Le message vous donnera un indice. Pour plus de détails, consultez les logs de votre fonction dans la console Firebase.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-4xl mx-auto mt-8 border-amber-500/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600"><AlertCircle /> Important</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>Cette page est un outil de développement et n'est accessible que sur votre machine locale (`localhost`). Elle ne sera pas visible sur votre site en ligne.</p>
                </CardContent>
            </Card>
        </div>
    );
}
