

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Brand, Category } from '@/lib/sheets';
import { filterItemsByBrandActivity } from '@/lib/activity-filter';
import { VideoBackground } from './video-background';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Share2, AppWindow, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { NodalGraphView } from './research/NodalGraphView';
import type { Node } from './research/use-simulation';
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

const ListView = ({ items, onOpenApp }: { items: ProcessedItem[], onOpenApp: (url: string) => void; }) => (
    <section className="w-full py-24 md:py-32 relative z-10">
        <div className="container px-4 md:px-6">
            <div className="space-y-4">
                {items.map((item) => (
                    <Card key={item.id} className="hover:border-primary hover:bg-muted/50 transition-all flex flex-col sm:flex-row">
                        <div className="flex-1">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">{item.Date}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            </CardContent>
                        </div>
                        <div className="p-6 flex flex-col sm:flex-row items-center gap-4 border-t sm:border-t-0 sm:border-l">
                           {item.pdfUrl && (
                             <Button variant="outline" asChild className="w-full sm:w-auto">
                                <Link href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                                    Voir PDF
                                </Link>
                            </Button>
                           )}
                           {(item as any).appUrl && (
                             <Button onClick={() => onOpenApp((item as any).appUrl)} className="w-full sm:w-auto">
                                <AppWindow className="mr-2 h-4 w-4" />
                                Ouvrir l\'app
                            </Button>
                           )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    </section>
);


interface ResearchPageClientProps {
  category: Category;
  brand?: Brand;
  initialData: ProcessedItem[];
  brands: Brand[];
}

export function ResearchPageClient({ category, brand, initialData, brands }: ResearchPageClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'app'>('graph');
  const [viewState, setViewState] = useState<ViewState>({ level: 'overview' });
  const [appUrl, setAppUrl] = useState<string | null>(null);

  const { resolvedTheme } = useTheme();
  const activeItemRef = useRef<HTMLLIElement>(null);

  const finalData = useMemo(() => {
    const brandFiltered = filterItemsByBrandActivity(initialData, brand?.Brand);
    return brandFiltered.map(item => ({
      ...item,
      title: item.Title || item.Name || item.Item || 'Untitled',
      description: item.Description || item.Content || '',
      appUrl: item['Url app'] || item['Url App'] || null,
    }));
  }, [initialData, brand]);

  const { activeCategoryName, nodeMap, itemNodesForCurrentCategory, categoryNodeMap } = useMemo(() => {
      const nodeMap = new Map<string, Node>();
      const categoryNodeMap = new Map<string, Node>();
      
      const centerNode: Node = { id: 'center', type: 'center' } as Node;
      
      const itemNodes: Node[] = [];
      const catNodes: Node[] = [];

      finalData.forEach(item => {
          const activities = item.Activity?.split(',').map(c => c.trim()) || [];
          activities.forEach(activity => {
              if (!categoryNodeMap.has(activity)) {
                  const catNode = { id: `cat-${activity}`, type: 'category', label: activity, parentAttractor: centerNode } as Node;
                  categoryNodeMap.set(activity, catNode);
                  catNodes.push(catNode);
              }
              const parentNode = categoryNodeMap.get(activity)!;
              const itemNode = { id: `${item.id}-${activity}`, type: 'item', label: item.title, parentAttractor: parentNode } as Node;
              nodeMap.set(itemNode.id, itemNode);
              itemNodes.push(itemNode);
          });
      });

      let catName = "Vue d'ensemble";
      if (viewState.level === 'category') catName = viewState.targetNode.label;
      if (viewState.level === 'item') catName = viewState.targetNode.parentAttractor?.label || "Vue d'ensemble";
      
      const itemsForCat = Array.from(nodeMap.values()).filter(node => node.parentAttractor?.label === catName);

      return { 
        activeCategoryName: catName, 
        nodeMap, 
        itemNodesForCurrentCategory: itemsForCat,
        categoryNodeMap
      };
  }, [viewState, finalData]);


  const activeItem = useMemo(() => {
      if (viewState.level === 'item') {
          const originalItemId = viewState.targetNode.id.split('-')[0];
          return finalData.find(item => item.id === originalItemId) || null;
      }
      return null;
  }, [viewState, finalData]);

  // Scroll to active item in the list
  useEffect(() => {
    if (activeItem && activeItemRef.current) {
        activeItemRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
  }, [activeItem]);


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

  const handleItemNavigation = (direction: 'next' | 'prev') => {
    if (!activeItem || itemsForCurrentCategory.length <= 1) return;

    const currentIndex = itemsForCurrentCategory.findIndex(item => item.id === activeItem.id);
    if (currentIndex === -1) return;

    const newIndex = (currentIndex + (direction === 'next' ? 1 : -1) + itemsForCurrentCategory.length) % itemsForCurrentCategory.length;
    const newItem = itemsForCurrentCategory[newIndex];
    
    // Find the corresponding node for the new item in the current category
    const newNodeId = `${newItem.id}-${activeCategoryName}`;
    const newNode = nodeMap.get(newNodeId);

    if (newNode) {
        setViewState({ level: 'item', targetNode: newNode });
    }
  };

  const handleListItemClick = (item: ProcessedItem) => {
    const categoryToFind = activeCategoryName === 'Vue d\'ensemble' 
        ? item.Activity?.split(',')[0].trim() 
        : activeCategoryName;
    
    if (categoryToFind) {
        const nodeId = `${item.id}-${categoryToFind}`;
        const targetNode = nodeMap.get(nodeId);
        if (targetNode) {
            setViewState({ level: 'item', targetNode });
        }
    }
  };

  const handleCategorySelect = useCallback((categoryName: string) => {
      if (categoryName === 'Vue d\'ensemble') {
          setViewState({ level: 'overview' });
      } else {
          const catNode = categoryNodeMap.get(categoryName);
          if (catNode) {
            setViewState({ level: 'category', targetNode: catNode });
          }
      }
  }, [categoryNodeMap]);
  
  const navigateCategories = (direction: 'next' | 'prev') => {
      const currentIndex = navigationCategories.indexOf(activeCategoryName);
      const newIndex = direction === 'next'
          ? (currentIndex + 1) % navigationCategories.length
          : (currentIndex - 1 + navigationCategories.length) % navigationCategories.length;
      
      handleCategorySelect(navigationCategories[newIndex]);
  };

  const handleOpenApp = (url: string) => {
    setAppUrl(url);
    setViewMode('app');
  };

  useEffect(() => {
    const isGraphRelatedView = viewMode === 'graph' || viewMode === 'app';
    if (isGraphRelatedView || window.location.pathname === '/home') {
      document.documentElement.classList.add('graph-view-active');
    } else {
      document.documentElement.classList.remove('graph-view-active');
    }

    return () => {
      document.documentElement.classList.remove('graph-view-active');
    };
  }, [viewMode]);

  const cyberClubLogo = useMemo(() => {
      const brand = brands.find(b => b.Brand === 'Cyber Club');
      return brand?.Logo || null;
  }, [brands]);
  
  const currentCategoryBrand = brands.find(b => b.Activity === activeCategoryName);
  const currentCategoryLogo = activeCategoryName === 'Vue d\'ensemble' 
    ? cyberClubLogo
    : currentCategoryBrand?.Logo || null;

  return (
    <div className="relative h-full min-h-screen w-full">
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
                 <div className="absolute top-24 left-4 md:left-8 z-10 max-w-sm w-[calc(100%-2rem)] md:w-auto">
                    <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl capitalize">
                        {category?.Name || 'Recherche'}
                    </h1>
                    <p className="max-w-[700px] text-muted-foreground md:text-xl mt-2">
                        {category?.Description || ''}
                    </p>
                </div>
                <ListView items={finalData} onOpenApp={handleOpenApp}/>
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
                <div className="absolute top-24 left-4 md:left-8 z-10 space-y-4 max-w-sm w-[calc(100%-2rem)] md:w-auto">
                    
                    <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50">
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
                    </div>

                    <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50 flex flex-col flex-1 min-h-0 max-h-[calc(100vh-14rem-6rem)]">
                        <h3 className="font-headline text-lg mb-2 border-b border-border/50 pb-2">Projets</h3>
                        <ScrollArea className="flex-1">
                            <ul className="space-y-1 text-xs">
                            {itemsForCurrentCategory.map(item => (
                                <li 
                                    key={item.id}
                                    ref={activeItem?.id === item.id ? activeItemRef : null}
                                    className={cn(
                                        "truncate rounded-md p-1 -mx-1 transition-colors cursor-pointer",
                                        activeItem?.id === item.id 
                                            ? 'bg-primary/20 text-primary font-semibold'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    )}
                                    onClick={() => handleListItemClick(item)}
                                >
                                    {item.title}
                                </li>
                            ))}
                            </ul>
                        </ScrollArea>
                    </div>
                </div>

                {activeItem && viewMode === 'graph' && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-8 z-10">
                        <ItemDetailPanel 
                            item={activeItem} 
                            onOpenApp={handleOpenApp}
                            onNextItem={() => handleItemNavigation('next')}
                            onPrevItem={() => handleItemNavigation('prev')}
                            hasNext={itemsForCurrentCategory.length > 1}
                            hasPrev={itemsForCurrentCategory.length > 1}
                        />
                    </div>
                )}
            </>
        )}
    </div>
  );
}

    

    
