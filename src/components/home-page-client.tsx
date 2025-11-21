
'use client';

import { type Brand, type Category } from '@/lib/sheets';
import { VideoBackground } from './video-background';

interface HomePageClientProps {
  category: Category;
  brand?: Brand;
}

export function HomePageClient({ category, brand }: HomePageClientProps) {
  const brandName = brand?.Brand || 'CYBER CLUB';

  return (
    <>
      {/* Section 1: Hero with Video Background */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center p-4">
        {category.Background && <VideoBackground src={category.Background} />}
        <div className="relative z-10 bg-background/20 backdrop-blur-sm p-8 rounded-lg">
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
            <span className="block text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground tracking-widest">Welcome to</span>
            <span className="capitalize">{brandName}</span>
          </h1>
        </div>
      </div>

      {/* Section 2: Blank Content Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Contenu à venir</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Cette section est prête à accueillir de nouveaux modules, composants ou informations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
