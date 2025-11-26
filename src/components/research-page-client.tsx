
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Brand, Category } from '@/lib/sheets';
import { filterItemsByBrandActivity } from '@/lib/activity-filter';
import { VideoBackground } from './video-background';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Share2, AppWindow, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { NodalGraphView } from './research/NodalGraphView';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';
import { ItemDetailPanel } from './research/ItemDetailPanel';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;
type ViewState = import('./research/NodalGraphView').ViewState;

const CATEGORY_ANGLES: Record<string, number> = {
  'Design': 0,
  'Architecture': 60,
  'Multimedias': 120,
  'Textile': 180,
  'Nature': 240,
  'Mecatronics': 300,
};

const ListView = ({ items, category, brand }: { items: ProcessedItem[], category: Category, brand?: Brand }) => (
    <section className="w-full py-24 md:py-32 relative z-10">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl capitalize">
                    {category?.Name || 'Recherche'}
                </h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                    {category?.Description || ''}
                </p>
            </div>
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
        </div>
    </section>
);


export function ResearchPageClient({ category, brand, initialData, brands }: ResearchPageClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'app'>('graph');
  const [viewState, setViewState] = useState<ViewState>({ level: 'overview' });
  const [appUrl, setAppUrl] = useState<string | null>(null);

  const { resolvedTheme } = useTheme();

  const finalData = useMemo(() => {
    const brandFiltered = filterItemsByBrandActivity(initialData, brand?.Brand);
    return brandFiltered.map(item => ({
      ...item,
      title: item.Title || item.Name || item.Item || 'Untitled',
      description: item.Description || item.Content || '',
      appUrl: item['Url app'] || null,
    }));
  }, [initialData, brand]);

  const activeCategoryName = useMemo(() => {
      if (viewState.level === 'category') return viewState.targetNode.label;
      if (viewState.level === 'item') return viewState.targetNode.parentAttractor?.label || "Vue d'ensemble";
      return "Vue d'ensemble";
  }, [viewState]);

  const activeItem = useMemo(() => {
      if (viewState.level === 'item') {
          // The node ID is constructed as `${item.id}-${activityName}`. We need to find the original item.
          const originalItemId = viewState.targetNode.id.split('-')[0];
          return finalData.find(item => item.id === originalItemId) || null;
      }
      return null;
  }, [viewState, finalData]);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    initialData.forEach(item => {
        const itemCategories = item.Activity?.split(',').map(c => c.trim()) || [];
        itemCategories.forEach(cat => categories.add(cat));
    });
    Object.keys(CATEGORY_ANGLES).forEach(cat => categories.add(cat));
    return Array.from(categories);
  }, [initialData]);

  const sortedVisibleCategories = useMemo(() => {
      return allCategories
          .filter(cat => cat !== 'Cyber Club' && cat !== 'Cybernetics' && cat !== 'Other' && CATEGORY_ANGLES[cat] !== undefined)
          .sort((a, b) => CATEGORY_ANGLES[a] - CATEGORY_ANGLES[b]);
  }, [allCategories]);

  const navigationCategories = useMemo(() => ["Vue d'ensemble", ...sortedVisibleCategories], [sortedVisibleCategories]);

  const itemsForCurrentCategory = useMemo(() => {
    if (activeCategoryName === 'Vue d\'ensemble') {
      return finalData;
    }
    return finalData.filter(item => {
      const itemActivities = item.Activity?.split(',').map(c => c.trim()) || [];
      return itemActivities.includes(activeCategoryName);
    });
  }, [finalData, activeCategoryName]);

  const cyberClubLogo = useMemo(() => {
      const brand = brands.find(b => b.Brand === 'Cyber Club');
      return brand?.Logo || null;
  }, [brands]);
  
  const currentCategoryBrand = brands.find(b => b.Activity === activeCategoryName);
  const currentCategoryLogo = activeCategoryName === 'Vue d\'ensemble' 
    ? cyberClubLogo
    : currentCategoryBrand?.Logo || null;

  const handleCategorySelect = useCallback((categoryName: string) => {
      // This function is now mainly for the navigation buttons, as the graph manages its own state
      const targetNode = viewState.level === 'category' ? viewState.targetNode : null;
      if (targetNode?.label !== categoryName) {
        // This could trigger a search for the category node and a zoom, if desired
      }
  }, [viewState]);
  
  const navigateCategories = (direction: 'next' | 'prev') => {
      const currentIndex = navigationCategories.indexOf(activeCategoryName);
      const newIndex = direction === 'next'
          ? (currentIndex + 1) % navigationCategories.length
          : (currentIndex - 1 + navigationCategories.length) % navigationCategories.length;
      
      handleCategorySelect(navigationCategories[newIndex]);
      // In the new architecture, we'd need to find the node and set the view state
  };

  const handleOpenApp = (url: string) => {
    setAppUrl(url);
    setViewMode('app');
  };

  useEffect(() => {
    const isGraphRelatedView = viewMode === 'graph' || viewMode === 'app';
    if (isGraphRelatedView) {
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('graph-view-active');
    } else {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('graph-view-active');
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('graph-view-active');
    };
  }, [viewMode]);

  return (
    <div className="relative h-full min-h-[calc(100vh-4rem)] w-full">
        {category.Background && <VideoBackground src={category.Background} />}
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'graph' | 'app')} className="absolute inset-0">
            <TabsList className="absolute top-8 w-full flex justify-center z-20 bg-transparent border-0">
                <div className="p-1 rounded-full bg-background/50 backdrop-blur-md border">
                    <TabsTrigger value="list" className="rounded-full px-4">
                        <List className="mr-2 h-4 w-4" />
                        Liste
                    </TabsTrigger>
                    <TabsTrigger value="graph" className="rounded-full px-4">
                        <Share2 className="mr-2 h-4 w-4" />
                        Graphe
                    </TabsTrigger>
                    <TabsTrigger value="app" className="rounded-full px-4" disabled={!appUrl}>
                        <AppWindow className="mr-2 h-4 w-4" />
                        Application
                    </TabsTrigger>
                </div>
            </TabsList>

            <TabsContent value="list" className="mt-0 h-full">
                <ListView items={finalData} category={category} brand={brand}/>
            </TabsContent>

            <TabsContent value="graph" className="mt-0 h-full w-full">
                <div className="absolute inset-0 z-0">
                    <NodalGraphView 
                        items={finalData} 
                        brands={brands}
                        viewState={viewState}
                        onViewStateChange={setViewState}
                    />
                </div>
            </TabsContent>
            
            <TabsContent value="app" className="mt-0 h-full w-full">
               {appUrl ? (
                    <iframe
                        src={appUrl}
                        className="w-full h-full border-0"
                        title="Embedded Application"
                        allow="camera; microphone; geolocation; vr"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Aucune application sélectionnée. Zoomez sur un item dans le graphe et cliquez sur "Ouvrir".</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
            
        {viewMode === 'graph' && (
            <>
                <div className="absolute top-24 left-4 md:left-8 z-10 max-w-sm w-[calc(100%-2rem)] md:w-auto flex flex-col">
                    {/* Bloc Titre + Slogan */}
                    <div className="mb-4">
                        <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl capitalize">
                            {category?.Name || 'Recherche'}
                        </h1>
                        <p className="max-w-[700px] text-muted-foreground md:text-xl mt-2">
                            {category?.Description || ''}
                        </p>
                    </div>
                    
                    {/* Boîte Flottante avec sélecteur et liste */}
                     <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50 flex flex-col flex-1 min-h-0 max-h-[calc(100vh-14rem-6rem)]">
                        <div className="flex items-center justify-center gap-2">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md" 
                                onClick={() => navigateCategories('prev')}
                                style={{ color: 'var(--brand-color)' }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div 
                                className="px-4 py-1 rounded-full bg-transparent border font-headline uppercase text-center min-w-[200px] flex items-center justify-center gap-3 text-sm flex-1"
                                style={{ color: 'var(--brand-color)', borderColor: 'var(--brand-color)' }}
                            >
                                {currentCategoryLogo && (
                                <Image 
                                    src={currentCategoryLogo} 
                                    alt={`${activeCategoryName} logo`}
                                    width={16}
                                    height={16}
                                    className={cn(resolvedTheme === 'dark' && activeCategoryName !== "Vue d'ensemble" && 'invert')}
                                />
                                )}
                                <span>{activeCategoryName}</span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md" 
                                onClick={() => navigateCategories('next')}
                                style={{ color: 'var(--brand-color)' }}
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <ScrollArea className="flex-1 mt-4 pt-4 border-t border-border/50">
                            <ul className="space-y-1 text-xs text-muted-foreground">
                            {itemsForCurrentCategory.map(item => (
                                <li key={item.id} className="truncate">
                                <Link href={item.pdfUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {item.title}
                                </Link>
                                </li>
                            ))}
                            </ul>
                        </ScrollArea>
                    </div>
                </div>

                {activeItem && viewMode === 'graph' && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-8 z-10">
                        <ItemDetailPanel item={activeItem} onOpenApp={handleOpenApp} />
                    </div>
                )}
            </>
        )}
    </div>
  );
}
