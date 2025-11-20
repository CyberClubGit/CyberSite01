
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Expand, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { getProxiedPdfUrl } from '@/lib/linkConverter';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Configure PDF.js worker using a stable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


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
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex items-center justify-center p-0 border-0 bg-transparent backdrop-blur-md">
        <div className="relative w-full h-full flex items-center justify-center">
          <Document file={pdfUrl}>
            <Page pageNumber={currentPage} height={window.innerHeight * 0.9} />
          </Document>
          {currentPage > 1 && <Button variant="ghost" size="icon" onClick={goToPrevPage} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm text-foreground"><ArrowLeft /></Button>}
          {currentPage < numPages && <Button variant="ghost" size="icon" onClick={goToNextPage} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm text-foreground"><ArrowRight /></Button>}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/50 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-sm">{currentPage} / {numPages}</div>
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
      
      {numPages && (
         <div className="overflow-x-auto py-4">
            <div className="flex space-x-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
                <div 
                  className="flex-shrink-0" 
                  key={pageNumber}
                >
                  <div className="relative group rounded-lg overflow-hidden border border-border aspect-[2/3] w-[200px] bg-muted/20">
                    <Page
                      pageNumber={pageNumber}
                      width={200}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain bg-white/5"
                      loading={<Skeleton className="w-full h-full" />}
                    />
                    <div
                      onClick={() => setFullscreenPage(pageNumber)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Expand className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
         </div>
      )}
    </Document>
  );
};
