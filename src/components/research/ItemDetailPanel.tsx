
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppWindow, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface ItemDetailPanelProps {
    item: ProcessedItem;
    onOpenApp: (url: string) => void;
}

export function ItemDetailPanel({ item, onOpenApp }: ItemDetailPanelProps) {
    
    const hasAppUrl = !!item.appUrl;

    return (
        <Card className={cn(
            "w-64 bg-background/70 backdrop-blur-lg border-border/50 shadow-2xl transition-all duration-300 animate-in fade-in-50 slide-in-from-right-10"
        )}>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
                {item.description && 
                    <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
                }
            </CardHeader>
            {item.displayImageUrl && (
                 <CardContent className="p-0">
                    <div className="relative w-full aspect-video bg-muted">
                        <Image 
                            src={item.displayImageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                </CardContent>
            )}
            <CardFooter className="p-3 grid gap-2">
                <Button 
                    onClick={() => hasAppUrl && onOpenApp(item.appUrl!)}
                    disabled={!hasAppUrl}
                    size="sm"
                >
                    <AppWindow className="mr-2 h-4 w-4" />
                    Ouvrir l'application
                </Button>
                {item.pdfUrl && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={item.pdfUrl} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Voir le PDF
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
