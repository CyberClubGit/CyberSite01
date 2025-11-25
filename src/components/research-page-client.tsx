
'use client';

import { useState, useMemo } from 'react';
import type { Brand, Category } from '@/lib/sheets';
import { filterItemsByBrandActivity } from '@/lib/activity-filter';
import { VideoBackground } from './video-background';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, LayoutGrid, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface ResearchPageClientProps {
  category: Category;
  brand?: Brand;
  initialData: ProcessedItem[];
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

const NodalGraphView = ({ items }: { items: ProcessedItem[] }) => {
  const positions = useMemo(() => {
    return items.map(() => ({
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
    }));
  }, [items]);

  return (
    <div className="relative w-full h-[60vh] border rounded-lg bg-background/50">
      {items.map((item, index) => (
        <Link href={item.pdfUrl || '#'} key={item.id} target="_blank" rel="noopener noreferrer">
          <div
            className="absolute p-2 rounded-lg bg-background border shadow-lg hover:scale-110 hover:shadow-primary/50 transition-transform duration-300 ease-in-out"
            style={{ top: positions[index].top, left: positions[index].left, transform: 'translate(-50%, -50%)' }}
          >
            <p className="text-xs font-semibold whitespace-nowrap">{item.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};


export function ResearchPageClient({ category, brand, initialData }: ResearchPageClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  const finalData = useMemo(() => {
    const brandFiltered = filterItemsByBrandActivity(initialData, brand?.Brand);
    return brandFiltered.map(item => ({
      ...item,
      title: item.Title || item.Name || item.Item || 'Untitled',
      description: item.Description || item.Content || '',
    }));
  }, [initialData, brand]);

  return (
    <>
      <div className="relative bg-transparent">
        {category.Background && <VideoBackground src={category.Background} />}
        <section className="w-full py-8 md:py-12 relative z-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none capitalize">
                  {category?.Name || 'Recherche'}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  {category?.Description || `Explorez nos publications et nos travaux.`}
                </p>
              </div>
            </div>

            <Tabs defaultValue="list" className="w-full" onValueChange={(value) => setViewMode(value as 'list' | 'graph')}>
              <div className="flex justify-center mb-8">
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
              <TabsContent value="list">
                <ListView items={finalData} />
              </TabsContent>
              <TabsContent value="graph">
                <NodalGraphView items={finalData} />
              </TabsContent>
            </Tabs>

          </div>
        </section>
      </div>
    </>
  );
}
