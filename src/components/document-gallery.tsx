
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import useEmblaCarousel from 'embla-carousel-react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, ExternalLink, Expand, Loader2 } from 'lucide-react';
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

interface FullscreenViewerProps {
  pdfUrl: string;
  initialPage: number;
  numPages: number;
  onClose: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ pdfUrl, initialPage, numPages, onClose }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex items-center justify-center p-0 border-0 bg-transparent">
             <DialogHeader className="sr-only">
                <DialogTitle>PDF Viewer</DialogTitle>
                <DialogDescription>
                    Viewing a PDF document in fullscreen. Use arrow keys to navigate pages.
                </DialogDescription>
            </DialogHeader>
             <div className="relative w-full h-full flex items-center justify-center">
                {isPageLoading && <Loader2 className="absolute animate-spin w-12 h-12 text-white"/>}
                <Page
                    pageNumber={currentPage}
                    width={window.innerWidth * 0.9}
                    renderTextLayer={false}
                    onLoadSuccess={() => setIsPageLoading(false)}
                    onRenderError={() => setIsPageLoading(false)}
                    className="[&>canvas]:max-w-full [&>canvas]:h-auto [&>canvas]:max-h-[90vh] [&>canvas]:rounded-lg"
                 />
                
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


interface PageThumbnailProps {
  pageNumber: number;
  onClick: () => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ pageNumber, onClick }) => {
    return (
        <div className="relative group rounded-lg overflow-hidden border border-border">
            <Page
                pageNumber={pageNumber}
                height={450} // 1.5x increase from an estimated 300px default height
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain"
                loading={<Skeleton className="w-full h-[450px]" />}
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


interface DocumentGalleryProps {
  pdfUrl: string;
}

export const DocumentGallery: React.FC<DocumentGalleryProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [fullscreenPage, setFullscreenPage] = useState<number | null>(null);

  const proxiedUrl = getProxiedPdfUrl(pdfUrl);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF document:', error);
    setError('Failed to load PDF.');
  };

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

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
    <div className="relative">
      <Document
        file={proxiedUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex -ml-4">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-2/3 sm:w-1/2 md:w-2/5 lg:w-1/3 pl-4">
                    <Skeleton className="w-full h-[450px] rounded-lg" />
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

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
              <div key={pageNumber} className="flex-shrink-0 w-2/3 sm:w-1/2 md:w-2/5 lg:w-1/3 pl-4">
                <PageThumbnail
                  pageNumber={pageNumber}
                  onClick={() => setFullscreenPage(pageNumber)}
                />
              </div>
            ))}
          </div>
        </div>
      </Document>

      {prevBtnEnabled &&
        <Button variant="ghost" size="icon" onClick={scrollPrev} className="absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm">
          <ArrowLeft />
        </Button>
      }
      {nextBtnEnabled &&
        <Button variant="ghost" size="icon" onClick={scrollNext} className="absolute -right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm">
          <ArrowRight />
        </Button>
      }
    </div>
  );
};
