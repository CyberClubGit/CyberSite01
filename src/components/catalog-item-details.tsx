
'use client';

import { useState } from 'react';
import { ViewerPanel } from './viewer-panel';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import {
  Images,
  X,
  ArrowLeft,
  ArrowRight,
  FileText,
  Wrench,
  Cuboid,
  Package,
  Ruler,
  Scale,
  Cpu,
  SquareCode,
  Layers,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { ScrambleTitle } from './ScrambleTitle';
import { InteractivePanel } from './interactive-panel';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';

// The item type comes from the sheet processing
type CatalogItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface CatalogItemDetailsProps {
  item: CatalogItem;
}

interface ImageViewerState {
  isOpen: boolean;
  images: string[];
  selectedIndex: number;
}

const ImageGallery: React.FC<{ images: string[], onImageClick: (index: number) => void }> = ({ images, onImageClick }) => {
  const [mainImageIndex, setMainImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="text-center text-muted-foreground p-8">Aucun visuel disponible.</div>;
  }

  const mainImageUrl = images[mainImageIndex];

  return (
    <div className="flex gap-2 h-full">
      {/* Main Image */}
      <div
        className="relative flex-1 aspect-[3/4] rounded-lg overflow-hidden group border cursor-pointer bg-muted"
        onClick={() => onImageClick(mainImageIndex)}
      >
        {mainImageUrl && (
          <Image
            src={mainImageUrl}
            alt={`Main gallery image`}
            fill
            sizes="(max-width: 1024px) 70vw, 50vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Images className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="w-14 flex-shrink-0">
          <ScrollArea className="h-full max-h-[500px]">
            <div className="flex flex-col gap-2 pr-2">
              {images.map((url, index) => (
                <div
                  key={index}
                  onClick={() => setMainImageIndex(index)}
                  className={cn(
                    "relative w-full aspect-[3/4] rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                    mainImageIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                  )}
                >
                  <Image
                    src={url}
                    alt={`Gallery thumbnail ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

const TechDetailItem: React.FC<{ icon: React.ElementType; label: string; value: string | undefined | null }> = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
};

export function CatalogItemDetails({ item }: CatalogItemDetailsProps) {
  const [imageViewer, setImageViewer] = useState<ImageViewerState>({ isOpen: false, images: [], selectedIndex: 0 });
  
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites(user?.uid);
  const { addToCart } = useCart();
  
  const openImageViewer = (images: string[], index: number) => {
    setImageViewer({ isOpen: true, images, selectedIndex: index });
  };
  const closeImageViewer = () => setImageViewer(prev => ({ ...prev, isOpen: false }));

  const nextImage = () => {
    setImageViewer(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % prev.images.length }));
  };
  const prevImage = () => {
    setImageViewer(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + prev.images.length) % prev.images.length }));
  };

  const handleAddToCart = () => {
    const priceModel = item.Price_Model ? parseFloat(item.Price_Model.replace(',', '.')) : 0;
    addToCart({
      id: item.ID,
      name: item.title,
      price: priceModel * 100, // Store price in cents
      image: item.galleryUrls?.[0] || '',
      quantity: 1,
    });
  };

  const isFavorited = favorites.includes(item.ID);
  const hasGallery = item.galleryUrls && item.galleryUrls.length > 0;
  const stlUrl = item.stlUrl;

  const galleryTabs = [
    { name: 'Galerie', icon: Images, content: hasGallery ? <ImageGallery images={item.galleryUrls} onImageClick={(index) => openImageViewer(item.galleryUrls, index)} /> : null, available: hasGallery },
  ].filter(tab => tab.available);

  const techDetails = [
    { icon: Layers, label: 'Material', value: item.Material },
    { icon: Cuboid, label: 'Type', value: item.Type },
    { icon: Scale, label: 'Weight', value: item.Weight },
    { icon: Ruler, label: 'Dimensions', value: item.Dimensions },
    { icon: Cpu, label: 'Software', value: item.Software },
    { icon: SquareCode, label: 'Gcode', value: item.Gcode_config },
  ].filter(detail => detail.value);

  const descriptionAndTechSection = (
    <InteractivePanel>
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b border-border/50 rounded-none mb-4">
          <TabsTrigger value="description" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            <FileText className="mr-2 h-4 w-4" />
            Description
          </TabsTrigger>
          <TabsTrigger value="tech" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            <Wrench className="mr-2 h-4 w-4" />
            Détails Techniques
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4">
          <ScrollArea className="h-24 pr-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.description || "No description available."}
            </p>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="tech" className="mt-4">
          <ScrollArea className="h-24 pr-4">
            {techDetails.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {techDetails.map(detail => (
                  <TechDetailItem key={detail.label} {...detail} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun détail technique disponible.
              </p>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </InteractivePanel>
  );
  
  const priceModel = item.Price_Model ? parseFloat(item.Price_Model.replace(',', '.')) : 0;
  const pricePrint = item.Price_Print ? parseFloat(item.Price_Print.replace(',', '.')) : 0;

  return (
    <>
      <div className="flex flex-col h-full w-full">
        <div className="relative w-fit -mb-px z-10 flex justify-between items-start w-full">
            <div className="relative -mb-px rounded-t-lg border-x border-t p-3 pr-6 transition-colors duration-200 border-border/80 bg-background/80 backdrop-blur-sm text-foreground shadow-sm">
                <ScrambleTitle
                    text={item.title}
                    as="h2"
                    className="text-2xl font-headline font-bold text-primary flex-shrink-0"
                />
            </div>
            <div className="flex gap-2 p-2">
              {user && (
                  <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm" onClick={() => toggleFavorite(item.ID)}>
                      <Heart className={cn("h-5 w-5", isFavorited ? "fill-red-500 text-red-500" : "text-foreground")} />
                  </Button>
              )}
              <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 text-foreground" />
              </Button>
            </div>
        </div>

        <div className="flex-1 min-h-0 bg-background/30 backdrop-blur-sm rounded-lg rounded-tl-none border border-border/80 p-6">
          <div className="flex flex-col lg:flex-row gap-6 h-full w-full">
            <div className="lg:w-1/2 w-full flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <div className="space-y-6 h-full">
                  {galleryTabs.length > 0 && (
                    <InteractivePanel className="h-full flex flex-col">
                      <Tabs defaultValue={galleryTabs[0].name} className="w-full flex-1 flex flex-col">
                        <TabsList className={cn("grid w-full bg-transparent p-0 border-b border-border/50 rounded-none mb-4", `grid-cols-${galleryTabs.length > 0 ? galleryTabs.length : 1}`)}>
                          {galleryTabs.map(tab => (
                            <TabsTrigger key={tab.name} value={tab.name} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                              <tab.icon className="mr-2 h-4 w-4" />
                              {tab.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {galleryTabs.map(tab => (
                          <TabsContent key={tab.name} value={tab.name} className="mt-4 flex-1">
                            {tab.content || <div className="text-center text-muted-foreground p-8">Aucun visuel disponible pour cette catégorie.</div>}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </InteractivePanel>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 w-full flex flex-col gap-6">
              <InteractivePanel className="flex-1 min-h-0">
                <ViewerPanel modelUrl={stlUrl} />
              </InteractivePanel>
              <div className="flex-shrink-0 flex flex-col gap-4">
                {descriptionAndTechSection}
                <div className="grid grid-cols-2 gap-4">
                    {priceModel > 0 && (
                        <Button size="lg" onClick={handleAddToCart}>
                            <ShoppingCart className="mr-2 h-5 w-5"/>
                            Ajouter Fichier 3D ({(priceModel).toFixed(2)} €)
                        </Button>
                    )}
                    {pricePrint > 0 && (
                        <Button size="lg" variant="secondary">
                            <ShoppingCart className="mr-2 h-5 w-5"/>
                            Impression 3D ({(pricePrint).toFixed(2)} €)
                        </Button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={imageViewer.isOpen} onOpenChange={(isOpen) => !isOpen && closeImageViewer()}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-2 bg-transparent border-0 flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Visionneuse d'image</DialogTitle>
            <DialogDescription>
              Agrandissement de l'image sélectionnée. Utilisez les flèches pour naviguer.
            </DialogDescription>
          </DialogHeader>
          {imageViewer.isOpen && (
            <div className="relative w-full h-full max-w-[calc(90vw-4rem)] max-h-[calc(90vh-4rem)] aspect-[3/4]">
              <Image
                src={imageViewer.images[imageViewer.selectedIndex]}
                alt={`Image ${imageViewer.selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={closeImageViewer}
            className="absolute top-2 right-2 h-10 w-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm z-10"
          >
            <X />
          </Button>
          {imageViewer.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
              >
                <ArrowRight />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
