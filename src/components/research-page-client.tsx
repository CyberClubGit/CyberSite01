
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Brand, Category } from '@/lib/sheets';
import { filterItemsByBrandActivity } from '@/lib/activity-filter';
import { VideoBackground } from './video-background';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { NodalGraphView } from './research/NodalGraphView';
import { cn } from '@/lib/utils';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface ResearchPageClientProps {
  category: Category;
  brand?: Brand;
  initialData: ProcessedItem[];
  brands: Brand[];
}

const ListView = ({ items }: { items: ProcessedItem[] }) => (
  <div className="space-y-4">
    {items.map((item) => (
      <Link href={item.pdfUrl || '#'} key={item.id} target="_blank" rel="noopener noreferrer" className="block">
        <Card className="hover:border-primary hover:bg-muted/50 transition-all">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{item.Date}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
);


export function ResearchPageClient({ category, brand, initialData, brands }: ResearchPageClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  const finalData = useMemo(() => {
    const brandFiltered = filterItemsByBrandActivity(initialData, brand?.Brand);
    return brandFiltered.map(item => ({
      ...item,
      title: item.Title || item.Name || item.Item || 'Untitled',
      description: item.Description || item.Content || '',
    }));
  }, [initialData, brand]);

  // Effect to lock/unlock page scroll based on view mode
  useEffect(() => {
    if (viewMode === 'graph') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function to restore scroll when the component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  return (
    <>
      <div className={cn("relative bg-transparent", viewMode === 'graph' && 'graph-view-active')}>
        {category.Background && <VideoBackground src={category.Background} />}

        <section className="w-full py-8 md:py-12 relative z-10">
          <div className="container px-4 md:px-6">
            <Tabs 
                value={viewMode} 
                onValueChange={(value) => setViewMode(value as 'list' | 'graph')}
                className="w-full"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                <div className="space-y-2 mb-4 md:mb-0">
                  <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl capitalize">
                    {category?.Name || 'Recherche'}
                  </h1>
                  <p className="max-w-[700px] text-muted-foreground">
                    {category?.Description || `Explorez nos publications et nos travaux.`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <TabsList>
                    <TabsTrigger value="list">
                      <List className="mr-2 h-4 w-4" />
                      Liste
                    </TabsTrigger>
                    <TabsTrigger value="graph">
                      <Share2 className="mr-2 h-4 w-4" />
                      Graphe Nodal
                    </TabsTrigger>
                    <TabsTrigger value="z" disabled>
                      (à venir)
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <TabsContent value="list">
                <ListView items={finalData} />
              </TabsContent>
              <TabsContent value="graph">
                <div className="w-full" style={{ height: 'calc(100vh - 16rem)'}}>
                    <NodalGraphView items={finalData} brands={brands} />
                </div>
              </TabsContent>
            </Tabs>

          </div>
        </section>
      </div>
    </>
  );
}

    
