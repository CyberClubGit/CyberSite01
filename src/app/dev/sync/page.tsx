
'use client';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function SyncPage() {
    // SECURITY: Redirect to home if in production environment.
    if (process.env.NODE_ENV === 'production') {
        redirect('/');
    }
  
    return (
        <div className="container py-12">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-center">Page de Synchronisation Désactivée</CardTitle>
                    <CardDescription className="text-center">
                        Cette page n'est plus utilisée.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Information</h3>
                        <p className="text-muted-foreground mb-4">
                            La logique de paiement a été mise à jour pour ne plus dépendre d'une synchronisation manuelle. Les produits sont créés dans Stripe directement lors du passage à la caisse. Cette page est conservée à des fins d'archivage mais n'a plus de fonctionnalité.
                        </p>
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
