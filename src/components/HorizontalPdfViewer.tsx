
'use client';

import React, 'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import useEmblaCarousel from 'embla-carousel-react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { getProxiedPdfUrl } from '@/lib/linkConverter';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();


interface PdfThumbnailProps {
  file: string;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const proxiedUrl = getProxiedPdfUrl(file);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF document:', error);
    setError('Failed to load PDF.');
  };

  if (error) {
    return (
      <a href={file} target="_blank" rel="noopener noreferrer" className="block w-full h-full bg-destructive/10 text-destructive-foreground p-2 rounded-md">
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xs font-semibold">Error</p>
            <p className="text-xs">Could not load preview</p>
            <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-destructive-foreground">Open<ExternalLink className='w-3 h-3 ml-1'/></Button>
        </div>
      </a>
    );
  }

  return (
    <div className="w-full h-full relative group">
      <Document
        file={proxiedUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<Skeleton className="w-full h-full" />}
        className="w-full h-full"
      >
        <Page
          pageNumber={1}
          width={200}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain"
        />
      </Document>
      <a
        href={file}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <ExternalLink className="w-8 h-8 text-white" />
      </a>
    </div>
  );
};


interface HorizontalPdfViewerProps {
  files: string[];
}

export const HorizontalPdfViewer: React.FC<HorizontalPdfViewerProps> = ({ files }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

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
  
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {files.map((file, index) => (
            <div key={index} className="flex-shrink-0 w-1/4 min-w-[150px] md:w-1/5 lg:w-1/6 pl-4">
               <div className="aspect-[2/3] rounded-lg overflow-hidden border border-border">
                 <PdfThumbnail file={file} />
               </div>
            </div>
          ))}
        </div>
      </div>
      { prevBtnEnabled &&
        <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
        >
            <ArrowLeft />
        </Button>
       }
      { nextBtnEnabled &&
        <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
        >
            <ArrowRight />
        </Button>
      }
    </div>
  );
};
