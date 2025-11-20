
'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Expand, Loader2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { getProxiedPdfUrl } from '@/lib/linkConverter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

// Configure PDF.js worker using a stable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageThumbnailProps {
  children: ReactNode;
  onClick: () => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ children, onClick }) => {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border h-full bg-muted/20">
      {children}
      <div
        onClick={onClick}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
      >
        <Expand className="w-8 h-8 text-white" />
      </div>
    </div>
  );
};


const FullscreenViewer: React.FC<{ pdfUrl: string; initialPage: number; numPages: number; onClose: () => void }> = ({ pdfUrl, initialPage, numPages, onClose }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
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
       <DialogContent className="max-w-[95vw] w-full h-[95vh] flex items-center justify-center p-0 border-0 bg-transparent backdrop-blur-md" showCloseButton={false}>
         <DialogHeader className="sr-only">
           <DialogTitle>PDF Viewer</DialogTitle>
           <DialogDescription>
             Viewing page {currentPage} of {numPages}. Use arrow keys to navigate.
           </DialogDescription>
         </DialogHeader>
        <div className="relative w-full h-full flex items-center justify-center">
          <Document file={pdfUrl}>
            <Page pageNumber={currentPage} height={window.innerHeight * 0.85} />
          </Document>
          
          {/* Conteneur pour les contrôles en bas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/50 backdrop-blur-sm text-foreground px-2 py-1 rounded-full flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={currentPage <= 1} className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-5 w-5"/>
            </Button>
            
            <div className="text-sm font-mono tabular-nums">
              {currentPage} / {numPages}
            </div>

            <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={currentPage >= numPages} className="h-8 w-8 rounded-full">
              <ArrowRight className="h-5 w-5" />
            </Button>

            <div className="border-l border-border/50 h-6 mx-1"></div>

            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export const DocumentGallery: React.FC<{ pdfUrl: string }> = ({ pdfUrl }) => {
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

  if (error) {
    return <div className="text-destructive text-center p-4">Error: {error}</div>;
  }

  return (
    <Document
      file={proxiedUrl}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={onDocumentLoadError}
      loading={<div className="flex justify-center items-center h-[300px]"><Loader2 className="w-8 h-8 animate-spin" /></div>}
    >
      {fullscreenPage !== null && numPages && (
        <FullscreenViewer
          pdfUrl={proxiedUrl}
          initialPage={fullscreenPage}
          numPages={numPages}
          onClose={() => setFullscreenPage(null)}
        />
      )}
      
       <div className="w-full overflow-x-auto py-4">
        <div className="flex space-x-4">
          {numPages ? (
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <div
                className="flex-shrink-0" 
                key={pageNumber}
                style={{ height: '450px' }}
              >
                 <PageThumbnail onClick={() => setFullscreenPage(pageNumber)}>
                    <Page
                        pageNumber={pageNumber}
                        height={450}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain"
                        loading={<Skeleton className="w-full h-full" />}
                    />
                </PageThumbnail>
              </div>
            ))
          ) : (
            <div className="w-full text-center text-muted-foreground">
              Chargement des pages...
            </div>
          )}
        </div>
      </div>
    </Document>
  );
};
