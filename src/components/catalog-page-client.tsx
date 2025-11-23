
'use client';

import { useState, useMemo, Fragment } from 'react';
import type { Brand, Category } from '@/lib/sheets';
import { filterItemsByBrandActivity } from '@/lib/activity-filter';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { VideoBackground } from './video-background';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CatalogItemDetails } from './catalog-item-details';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// The interface of the item processed, to ensure consistency
type CatalogItem = {
  id: string; // The normalized, non-optional ID
  title: string;
  description: string;
  galleryUrls: string[];
  displayImageUrl: string | null;
  Price_Print: string; // Price is a string from the sheet
  [key: string]: any; // Allow other properties
};


interface CatalogPageClientProps {
  initialData: CatalogItem[]; 
  category: Category;
  brand?: Brand;
  types: string[];
  materials: string[];
}

/**
 * Utility to convert a price string from the sheet (e.g., "2,50" or "2") into an integer in cents.
 * @param priceStr The price string from the Google Sheet.
 * @returns The price in cents as a number (e.g., 250 or 200). Returns 0 if invalid.
 */
function priceToCents(priceStr: string | undefined): number {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  
  // Replace comma with a dot for decimal conversion and parse it
  const cleaned = priceStr.replace(',', '.');
  const price = parseFloat(cleaned);
  
  // If parsing fails or result is not a number, return 0
  if (isNaN(price)) return 0;
  
  // Convert to cents and round to avoid floating point issues
  return Math.round(price * 100);
}


export function CatalogPageClient({ initialData, category, brand, types, materials }: CatalogPageClientProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const { addToCart } = useCart();

  const handleFilterChange = (filterType: 'type' | 'material', value: string) => {
    const setter = filterType === 'type' ? setSelectedTypes : setSelectedMaterials;
    setter(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };
  
  const finalData: CatalogItem[] = useMemo(() => {
    const brandFiltered = filterItemsByBrandActivity(initialData, brand?.Brand);
    
    return brandFiltered.filter(item => {
      const typeMatch = selectedTypes.length === 0 || (item.Type && selectedTypes.includes(item.Type));
      const materialMatch = selectedMaterials.length === 0 || (item.Material && selectedMaterials.includes(item.Material));
      return typeMatch && materialMatch;
    });

  }, [initialData, brand, selectedTypes, selectedMaterials]);
  
  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedMaterials([]);
  };

  const handleAddToCart = (e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation(); // Prevent opening the details dialog
    
    // Ensure the item and its ID are valid before adding to cart.
    if (!item || !item.id || item.id.includes('#NAME?')) {
      console.error("Attempted to add an invalid item to cart:", item);
      return; // Block adding invalid item
    }

    const priceInCents = priceToCents(item.Price_Print);
    if (priceInCents > 0) {
      addToCart({
        id: item.id, // USE NORMALIZED ID
        name: item.title,
        price: priceInCents,
        image: item.displayImageUrl || '',
        quantity: 1,
      });
    }
  };

  return (
    <>
      <div className={cn("relative bg-transparent")}>
        {category.Background && <VideoBackground src={category.Background} />}
        <section className="w-full py-8 md:py-12 relative z-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none capitalize">
                  {category?.Name || 'Catalogue'}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  {category?.Description || (brand ? `Contenu pour ${category?.Name} sous la marque ${brand.Brand}` : `Contenu à venir pour ${category?.Name}`)}
                </p>
              </div>
            </div>

            <aside className="sticky top-16 bg-background/80 backdrop-blur-sm z-20 py-4 mb-8 rounded-lg border">
              <div className="flex flex-col md:flex-row gap-4">
                  <Accordion type="multiple" className="w-full md:w-auto md:flex-1">
                    <AccordionItem value="type">
                      <AccordionTrigger className="font-headline px-4">Type</AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {types.map(type => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type}`}
                                checked={selectedTypes.includes(type)}
                                onCheckedChange={() => handleFilterChange('type', type)}
                              />
                              <Label htmlFor={`type-${type}`} className="font-body text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Accordion type="multiple" className="w-full md:w-auto md:flex-1">
                    <AccordionItem value="material">
                      <AccordionTrigger className="font-headline px-4">Matériau</AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {materials.map(material => (
                            <div key={material} className="flex items-center space-x-2">
                              <Checkbox
                                id={`material-${material}`}
                                checked={selectedMaterials.includes(material)}
                                onCheckedChange={() => handleFilterChange('material', material)}
                              />
                              <Label htmlFor={`material-${material}`} className="font-body text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">{material}</Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
              </div>
              {(selectedTypes.length > 0 || selectedMaterials.length > 0) && (
                <Button variant="ghost" onClick={resetFilters} className="w-full mt-4 justify-start p-0 h-auto text-muted-foreground hover:text-foreground">
                  Réinitialiser les filtres
                </Button>
              )}
            </aside>

            <main>
              {finalData && finalData.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {finalData.map((item) => {
                      const isItemValid = item.id && !item.id.includes('#NAME?');
                      const priceInCents = priceToCents(item.Price_Print);
                      return (
                        <Card 
                          key={item.id} // USE NORMALIZED ID AS KEY
                          className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/80 backdrop-blur-sm group"
                        >
                           <div 
                              className={cn("relative w-full aspect-[3/4] bg-muted", isItemValid && "cursor-pointer")}
                              onClick={() => isItemValid && setSelectedItem(item)}
                           >
                            {item.displayImageUrl && (
                              <Image
                                src={item.displayImageUrl}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                              />
                            )}
                             <div className="absolute top-2 right-2 flex flex-col gap-2">
                                {priceInCents > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-full h-8 w-8 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 hover:text-white"
                                            onClick={(e) => handleAddToCart(e, item)}
                                            disabled={!isItemValid}
                                          >
                                            <ShoppingCart className="h-5 w-5" />
                                            <span className="sr-only">Ajouter au panier</span>
                                          </Button>
                                        </TooltipTrigger>
                                      </Tooltip>
                                    </TooltipProvider>
                                )}
                             </div>
                          </div>
                          <CardHeader onClick={() => isItemValid && setSelectedItem(item)} className={cn(isItemValid && "cursor-pointer")}>
                            <CardTitle className="font-headline text-lg leading-tight">{item.title}</CardTitle>
                          </CardHeader>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-12 text-center text-muted-foreground md:mt-0 md:flex md:items-center md:justify-center h-full">
                    <p>Aucun élément ne correspond à votre sélection.</p>
                  </div>
                )}
              </main>
          </div>
        </section>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-4 border-0 bg-background/30 backdrop-blur-sm flex flex-col overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedItem?.title || 'Chargement en cours...'}</DialogTitle>
            <DialogDescription>
              Detailed view of the selected catalog item.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {selectedItem ? <CatalogItemDetails item={selectedItem} /> : <div>Chargement...</div>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
