
'use client';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TriangleAlert } from 'lucide-react';

export default function SyncPage() {
    // SECURITY: Redirect to home if in production environment.
    if (process.env.NODE_ENV === 'production') {
        redirect('/');
    }

    return (
        <div className="container py-12">
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto w-fit rounded-full bg-yellow-100 dark:bg-yellow-900 p-3">
                         <TriangleAlert className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-2xl font-headline mt-4">
                        Outil de Synchronisation Déprécié
                    </CardTitle>
                    <CardDescription>
                        Cette fonctionnalité n'est plus active.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>
                        La synchronisation des produits depuis Google Sheets vers Stripe et Firestore a été désactivée.
                    </p>
                    <p className="mt-2">
                        Le catalogue utilise maintenant les données directement depuis Google Sheets comme source de vérité unique.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
