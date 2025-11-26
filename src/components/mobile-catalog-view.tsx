
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Home, X, Rows, Grid } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { CatalogItem } from './catalog-page-client';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface MobileCatalogViewProps {
  initialData: CatalogItem[];
  onSelectItem: (item: CatalogItem) => void;
}

export function MobileCatalogView({ initialData, onSelectItem }: MobileCatalogViewProps) {
  const [view, setView] = useState<'discover' | 'favorites' | 'grid'>('discover');
  const [discoverIndex, setDiscoverIndex] = useState(0);

  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const handleNext = () => {
    setDiscoverIndex(prev => (prev + 1) % initialData.length);
  };
  
  const handleLike = (item: CatalogItem) => {
    toggleFavorite(item); // Like or unlike
    handleNext();
  };

  const currentItem = initialData[discoverIndex];

  return (
    <div className="h-screen w-screen flex flex-col bg-background md:hidden">
      {/* Top Navigation */}
      <div className="flex-shrink-0 p-4 border-b">
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">Découvrir</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="grid">Grille</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'discover' && currentItem && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden">
            <Card className="w-full max-w-sm h-[70vh] flex flex-col shadow-lg" onClick={() => onSelectItem(currentItem)}>
              <CardContent className="relative flex-1 p-0 rounded-lg overflow-hidden">
                {currentItem.displayImageUrl ? (
                  <Image
                    src={currentItem.displayImageUrl}
                    alt={currentItem.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 384px"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Pas d'image</span>
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
                    <h3 className="font-headline text-2xl font-bold text-white">{currentItem.title}</h3>
                    {currentItem.Price_Print && (
                        <Badge variant="secondary" className="mt-1">{currentItem.Price_Print} €</Badge>
                    )}
                </div>
              </CardContent>
            </Card>
             <div className="absolute bottom-16 flex gap-8">
                <Button variant="outline" size="icon" className="h-20 w-20 rounded-full border-4 border-destructive text-destructive bg-background/50 backdrop-blur-sm shadow-2xl" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                    <X className="h-10 w-10" />
                </Button>
                <Button variant="outline" size="icon" className="h-20 w-20 rounded-full border-4 border-green-500 text-green-500 bg-background/50 backdrop-blur-sm shadow-2xl" onClick={(e) => { e.stopPropagation(); handleLike(currentItem); }}>
                    <Heart className="h-10 w-10" fill={isFavorite(currentItem.id) ? "currentColor" : "none"} />
                </Button>
            </div>
          </div>
        )}
        
        {view === 'favorites' && (
           <div className="p-4">
            <h2 className="text-2xl font-headline mb-4">Mes Favoris</h2>
             {favorites.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {favorites.map(item => (
                        <Card key={item.id} className="group" onClick={() => onSelectItem(item)}>
                            <CardContent className="relative aspect-[3/4] p-0">
                                {item.displayImageUrl ? (
                                    <Image src={item.displayImageUrl} alt={item.title} fill className="object-cover rounded-t-lg" />
                                ) : (
                                    <div className="w-full h-full bg-muted rounded-t-lg"></div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardContent>
                            <CardFooter className="p-2">
                                <p className="text-xs font-semibold truncate">{item.title}</p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
             ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Heart className="mx-auto h-12 w-12 mb-4" />
                    <p>Vous n'avez pas encore de favoris.</p>
                </div>
             )}
           </div>
        )}
        
        {view === 'grid' && (
            <div className="grid grid-cols-3 gap-1 p-1">
                {initialData.map(item => (
                    <div key={item.id} className="relative aspect-square group" onClick={() => onSelectItem(item)}>
                        {item.displayImageUrl ? (
                            <Image src={item.displayImageUrl} alt={item.title} fill className="object-cover"/>
                        ) : (
                            <div className="w-full h-full bg-muted"></div>
                        )}
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
}
