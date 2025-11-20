
'use client';

import { useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { revalidateData } from '@/lib/actions';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleClick = () => {
    startTransition(() => {
      revalidateData(pathname);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Actualiser les données"
    >
      <RefreshCw
        className={cn(
          'h-[1.2rem] w-[1.2rem] transition-transform',
          isPending && 'animate-spin'
        )}
      />
      <span className="sr-only">Actualiser les données</span>
    </Button>
  );
}
