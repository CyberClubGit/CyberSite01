
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ExternalLink, Expand, Loader2 } from 'lucide-react';
import { getProxiedPdfUrl } from '@/lib/linkConverter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// =================================
// Fullscreen Viewer Component
// =================================
interface FullscreenViewerProps {
  pdfUrl: string;
  initialPage: number;
  numPages: number;
  onClose: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ pdfUrl, initialPage, numPages, onClose }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const goToPrevPage = useCallback(() => setCurrentPage(prev => Math.max(1, prev - 1)), []);
  const goToNextPage = useCallback(() => setCurrentPage(prev => Math.min(numPages, prev + 1)), [numPages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, onClose]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex items-center justify-center p-0 border-0 bg-transparent backdrop-blur-md">
             <DialogHeader className="sr-only">
                <DialogTitle>PDF Viewer</DialogTitle>
                <DialogDescription>
                    Viewing a PDF document in fullscreen. Use arrow keys to navigate pages.
                </DialogDescription>
            </DialogHeader>
             <div className="relative w-full h-full flex items-center justify-center">
                {isPageLoading && <Loader2 className="absolute animate-spin w-12 h-12 text-white"/>}
                <Document file={pdfUrl}>
                  <Page
                      pageNumber={currentPage}
                      height={window.innerHeight * 0.9}
                      renderTextLayer={false}
                      onLoadSuccess={() => setIsPageLoading(false)}
                      onRenderError={() => setIsPageLoading(false)}
                      className="[&>canvas]:max-w-full [&>canvas]:h-auto [&>canvas]:max-h-[90vh] [&>canvas]:rounded-lg"
                  />
                </Document>
                
                {currentPage > 1 && (
                    <Button variant="ghost" size="icon" onClick={goToPrevPage} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm text-foreground">
                        <ArrowLeft />
                    </Button>
                )}
                {currentPage < numPages && (
                    <Button variant="ghost" size="icon" onClick={goToNextPage} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm text-foreground">
                        <ArrowRight />
                    </Button>
                )}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/50 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-sm">
                    {currentPage} / {numPages}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
};


// =================================
// Page Thumbnail Component
// =================================
interface PageThumbnailProps {
  pageNumber: number;
  onClick: () => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ pageNumber, onClick }) => {
    return (
        <div className="relative group rounded-lg overflow-hidden border border-border h-[450px]">
            <Page
                pageNumber={pageNumber}
                height={450}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain bg-white"
                loading={<Skeleton className="w-full h-full" />}
            />
            <div
                onClick={onClick}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
                <Expand className="w-8 h-8 text-white" />
            </div>
        </div>
    );
};


// =================================
// Interactive Gallery Component
// =================================
interface InteractiveGalleryProps {
  children: React.ReactNode;
}

const InteractiveGallery: React.FC<InteractiveGalleryProps> = ({ children }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const scrollZoneRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(0);

  const calculateScrollSpeed = (mouseX: number, containerWidth: number) => {
    const deadZone = 0.3; // 30% in the middle
    const edgeZone = (1 - deadZone) / 2; // 35% on each side
    const position = mouseX / containerWidth;

    if (position < edgeZone) {
      // Left zone
      return (position / edgeZone - 1) * 2; // Speed from -2 to 0
    }
    if (position > 1 - edgeZone) {
      // Right zone
      return ((position - (1 - edgeZone)) / edgeZone) * 2; // Speed from 0 to 2
    }
    // Center zone
    return 0;
  };
  
  const scroll = useCallback(() => {
    if (!emblaApi) return;
    if (scrollSpeedRef.current !== 0) {
      emblaApi.scrollBy(scrollSpeedRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(scroll);
  }, [emblaApi]);


  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollZoneRef.current) return;
    const { left, width } = scrollZoneRef.current.getBoundingClientRect();
    const mouseX = event.clientX - left;
    scrollSpeedRef.current = calculateScrollSpeed(mouseX, width);
  };

  const handleMouseLeave = () => {
    scrollSpeedRef.current = 0;
  };

  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on('pointerDown', () => {
      if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      scrollSpeedRef.current = 0;
    });

    emblaApi.on('pointerUp', () => {
      if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(scroll);
    });

    animationFrameRef.current = requestAnimationFrame(scroll);
    
    return () => {
      if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };

  }, [emblaApi, scroll]);


  return (
    <div 
      className="relative cursor-grab active:cursor-grabbing"
      ref={scrollZoneRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
    >
        <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
                {children}
            </div>
        </div>
    </div>
  );
};



// =================================
// Main Document Gallery Component
// =================================
interface DocumentGalleryProps {
  pdfUrl: string;
}

export const DocumentGallery: React.FC<DocumentGalleryProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenPage, setFullscreenPage] = useState<number | null>(null);

  const proxiedUrl = getProxiedPdfUrl(pdfUrl);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF document:', error);
    setError('Failed to load PDF.');
  }, []);

  if (!pdfUrl) {
    return null;
  }

  if (error) {
    return (
      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full bg-destructive/10 text-destructive-foreground p-2 rounded-md">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xs font-semibold">Error</p>
          <p className="text-xs">Could not load preview</p>
          <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-destructive-foreground">Open<ExternalLink className='w-3 h-3 ml-1' /></Button>
        </div>
      </a>
    );
  }

  return (
    <Document
      file={proxiedUrl}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={onDocumentLoadError}
      loading={
        <div className="flex -ml-4">
          {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 pl-4" style={{ flexBasis: 'auto' }}>
                  <Skeleton className="w-[320px] h-[450px] rounded-lg" />
              </div>
          ))}
        </div>
      }
    >
      {fullscreenPage !== null && numPages && (
        <FullscreenViewer
          pdfUrl={proxiedUrl}
          initialPage={fullscreenPage}
          numPages={numPages}
          onClose={() => setFullscreenPage(null)}
        />
      )}
      
      {numPages && (
        <InteractiveGallery>
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
            <div key={pageNumber} className="flex-shrink-0 pl-4" style={{ flexBasis: 'auto' }}>
              <PageThumbnail
                pageNumber={pageNumber}
                onClick={() => setFullscreenPage(pageNumber)}
              />
            </div>
          ))}
        </InteractiveGallery>
      )}
    </Document>
  );
};

    