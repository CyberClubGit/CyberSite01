
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { normalizeRowData } from '@/lib/sheets-utils';
import { Badge } from '@/components/ui/badge';
import { Link, FileText, Download } from 'lucide-react';


export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  
  const categories = await getCategories();
  const brands = await getBrands();

  let brand: Brand | undefined;
  let category: Category | undefined;
  
  const lastSlugPart = slug.length > 0 ? slug[slug.length - 1] : 'home';
  const potentialBrandSlug = slug.length > 1 ? slug[0] : undefined;
  
  category = categories.find(c => c.Url && c.Url.toLowerCase() === lastSlugPart.toLowerCase());

  if (potentialBrandSlug) {
      brand = brands.find(b => b.Activity && b.Activity.toLowerCase() === potentialBrandSlug.toLowerCase());
  }

  if (!category || !category.Url) {
    notFound();
  }
  
  const categoryData = await getCategoryData(category.Url);

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none capitalize">
              {category?.Name || 'Catégorie'}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {brand ? `Contenu pour ${category?.Name} sous la marque ${brand.Brand}` : `Contenu à venir pour ${category?.Name}`}
            </p>
          </div>
        </div>

        {categoryData && categoryData.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryData.map((rawItem, index) => {
              const item = normalizeRowData(rawItem);
              
              return (
                <Card key={index} className="flex flex-col overflow-hidden">
                  {item.displayImageUrl && (
                    <div className="relative w-full h-48 bg-muted">
                      <Image
                        src={item.displayImageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
                    {item.description && (
                        <CardDescription className="line-clamp-3 h-[60px]">
                            {item.description}
                        </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-xs">
                    {(item.author || item.date) && (
                         <div className="text-muted-foreground flex flex-wrap gap-x-2">
                            {item.author && <span>👤 {item.author}</span>}
                            {item.date && <span>📅 {item.date}</span>}
                        </div>
                    )}
                     <div className="flex flex-wrap gap-1">
                        {item.Type && <Badge variant="secondary">{item.Type}</Badge>}
                        {item.Style && <Badge variant="secondary">{item.Style}</Badge>}
                        {item.Activity && <Badge variant="outline">{item.Activity}</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="flex-wrap gap-2 text-xs">
                    {item.pdfUrl && <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline"><FileText size={14}/> PDF</a>}
                    {item.stlUrl && <a href={item.stlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline"><Download size={14}/> STL</a>}
                    {item.galleryUrls.length > 0 && <span className="text-muted-foreground">{item.galleryUrls.length} images</span>}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 w-full mx-auto bg-muted/50 p-4 rounded-lg">
          <h2 className="text-2xl font-headline font-bold mb-4 text-center">Données brutes de la feuille :</h2>
          <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto">
            {JSON.stringify({ category, brand, data: categoryData }, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
