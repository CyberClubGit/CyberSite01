
'use client';

import { useState, useMemo } from 'react';
import type { Brand, Category } from '@/lib/sheets';
import { filterItemsByBrandActivity } from '@/lib/activity-filter';
import { processGalleryLinks } from '@/lib/sheets';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface CatalogPageClientProps {
  initialData: any[];
  category: Category;
  brand?: Brand;
  types: string[];
  materials: string[];
}

export function CatalogPageClient({ initialData, category, brand, types, materials }: CatalogPageClientProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const handleFilterChange = (filterType: 'type' | 'material', value: string) => {
    const setter = filterType === 'type' ? setSelectedTypes : setSelectedMaterials;
    setter(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const filteredData = useMemo(() => {
    const brandFiltered = filterItemsByBrandActivity(initialData, brand?.Brand);
    return brandFiltered.filter(item => {
      const typeMatch = selectedTypes.length === 0 || (item.Type && selectedTypes.includes(item.Type));
      const materialMatch = selectedMaterials.length === 0 || (item.Material && selectedMaterials.includes(item.Material));
      return typeMatch && materialMatch;
    });
  }, [initialData, brand, selectedTypes, selectedMaterials]);

  const finalData = useMemo(() => {
    return filteredData.map(processGalleryLinks).map(item => {
      let displayImageUrl = null;
      if (item.coverUrl) {
        displayImageUrl = item.coverUrl;
      } else if (item.galleryUrls && item.galleryUrls.length > 0) {
        displayImageUrl = item.galleryUrls[0];
      } else if (item['Url Logo Png']) {
        displayImageUrl = item['Url Logo Png'];
      }
      return {
        ...item,
        title: item.Title || item.Name || item.Item || 'Untitled',
        description: item.Description || item.Content || '',
        displayImageUrl,
      };
    });
  }, [filteredData]);
  
  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedMaterials([]);
  };

  return (
    <>
      <div className={cn("relative bg-background")}>
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
                    {finalData.map((item, index) => (
                      <Card key={index} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {item.displayImageUrl && (
                          <div className="relative w-full aspect-[3/4] bg-muted">
                            <Image
                              src={item.displayImageUrl}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="font-headline text-lg leading-tight">{item.title}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
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
    </>
  );
}
