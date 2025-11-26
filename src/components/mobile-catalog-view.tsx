
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Rows, Grid, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { type CatalogItem } from './catalog-page-client';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { CatalogItemDetails } from './catalog-item-details';

interface MobileCatalogViewProps {
  initialData: CatalogItem[];
}

export function MobileCatalogView({ initialData }: MobileCatalogViewProps) {
  const [view, setView] = useState<'discover' | 'favorites' | 'grid'>('discover');
  const [discoverIndex, setDiscoverIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const handleNext = () => {
    setDiscoverIndex(prev => (prev + 1) % initialData.length);
  };

  const handleLike = (item: CatalogItem) => {
    toggleFavorite(item);
    handleNext();
  };

  const currentItem = initialData[discoverIndex];
  const isCurrentItemFavorite = currentItem ? isFavorite(currentItem.id) : false;

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItem(item);
  };
  
  if (selectedItem) {
    return (
        <div className="h-screen w-screen flex flex-col bg-background md:hidden">
            <div className="flex-shrink-0 p-2 border-b">
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                    <ArrowLeft />
                    <span className="sr-only">Retour</span>
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <CatalogItemDetails item={selectedItem} />
            </div>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background md:hidden">
      {/* Top Navigation */}
      <div className="flex-shrink-0 p-4 border-b">
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">
              <Rows className="w-4 h-4 mr-2" />
              Découvrir
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favoris
            </TabsTrigger>
            <TabsTrigger value="grid">
              <Grid className="w-4 h-4 mr-2" />
              Grille
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'discover' && currentItem && (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-sm h-full flex flex-col shadow-lg" onClick={() => handleSelectItem(currentItem)}>
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
                <span className="text-4xl font-headline">×</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-20 w-20 rounded-full border-4 bg-background/50 backdrop-blur-sm shadow-2xl transition-all duration-300",
                  isCurrentItemFavorite
                    ? "border-green-500 text-green-500 shadow-[0_0_20px_5px] shadow-green-500/50"
                    : "border-muted-foreground text-muted-foreground"
                )}
                onClick={(e) => { e.stopPropagation(); handleLike(currentItem); }}
              >
                <Heart
                  className={cn("h-10 w-10 transition-transform duration-300", isCurrentItemFavorite && "scale-125")}
                  fill={isCurrentItemFavorite ? "currentColor" : "none"}
                />

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
                        <Card key={item.id} className="group" onClick={() => handleSelectItem(item)}>
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
                    <div key={item.id} className="relative aspect-square group" onClick={() => handleSelectItem(item)}>
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
