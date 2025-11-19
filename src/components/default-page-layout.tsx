
'use client';

import { useState } from 'react';
import { getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { filterItemsByBrandActivity, getActivityForBrand } from '@/lib/activity-filter';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { VideoBackground } from './video-background';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProjectDetails } from './ProjectDetails';

type ProcessedItem = ReturnType<typeof processGalleryLinks>;

interface DefaultPageLayoutProps {
  category: Category;
  brand?: Brand;
  initialData: ProcessedItem[];
}

export default function DefaultPageLayout({ category, brand, initialData }: DefaultPageLayoutProps) {
  const [selectedProject, setSelectedProject] = useState<ProcessedItem | null>(null);

  if (!category.Url) {
    return (
      <div className={cn("min-h-full bg-transparent")}>
        <section className="w-full py-8 md:py-12">
            <div className="container px-4 md:px-6 text-center">
                <p>Catégorie invalide.</p>
            </div>
        </section>
      </div>
    );
  }

  const isProjectsPage = category.Url.toLowerCase() === 'projects';
  
  const filteredData = filterItemsByBrandActivity(initialData, brand?.Brand);

  const finalData = filteredData.map(item => {
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

  return (
      <>
        <div className={cn("relative bg-transparent")}>
          {category.Background && <VideoBackground src={category.Background} />}
          {isProjectsPage && <div className="projects-background"></div>}
          <section className="w-full py-8 md:py-12 relative z-10">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center mb-12">
                <div className="space-y-2">
                  <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none capitalize">
                    {category?.Name || 'Catégorie'}
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    {category?.Description || (brand ? `Contenu pour ${category?.Name} sous la marque ${brand.Brand}` : `Contenu à venir pour ${category?.Name}`)}
                  </p>
                </div>
              </div>

              {finalData && finalData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {finalData.map((item, index) => (
                      <Card 
                        key={index} 
                        className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/80 backdrop-blur-sm cursor-pointer"
                        onClick={() => isProjectsPage && setSelectedProject(item)}
                      >
                        {item.displayImageUrl && (
                          <div className="relative w-full bg-muted">
                            <Image
                              src={item.displayImageUrl}
                              alt={item.title}
                              width={500}
                              height={500}
                              className="object-cover w-full h-auto"
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
                <div className="mt-12 text-center text-muted-foreground">
                  <p>Aucun élément trouvé pour cette catégorie {brand && brand.Brand !== 'Cyber Club' ? `et l'activité "${getActivityForBrand(brand.Brand)}"` : ''}.</p>
                </div>
              )}
            </div>
          </section>
        </div>
        <Dialog open={!!selectedProject} onOpenChange={(isOpen) => !isOpen && setSelectedProject(null)}>
            <DialogContent className="max-w-7xl w-full h-[90vh] p-0 border-0">
                {selectedProject && <ProjectDetails project={selectedProject} />}
            </DialogContent>
        </Dialog>
      </>
  );
}
