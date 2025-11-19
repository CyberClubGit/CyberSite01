import { getBrands, getCategories, getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, FileText, Download, GalleryHorizontal } from 'lucide-react';


export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  
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
  
  const rawCategoryData = await getCategoryData(category.Url);
  const categoryData = rawCategoryData.map(processGalleryLinks);

  // Determine a display image for each item
  const finalData = categoryData.map(item => {
    let displayImageUrl = null;
    if (item.coverUrl) {
      displayImageUrl = item.coverUrl;
    } else if (item.galleryUrls && item.galleryUrls.length > 0) {
      displayImageUrl = item.galleryUrls[0];
    } else if (item['Url Logo Png']) {
      displayImageUrl = item['Url Logo Png'];
    }

    return {
      ...item,
      title: item.Title || item.Name || item.Item || 'Untitled',
      description: item.Description || item.Content || '',
      displayImageUrl,
    };
  });

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

        {finalData && finalData.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {finalData.map((item, index) => (
                <Card key={index} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  {item.displayImageUrl && (
                    <div className="relative w-full h-48 bg-muted">
                      <Image
                        src={item.displayImageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-headline text-lg leading-tight">{item.title}</CardTitle>
                    {item.description && (
                        <CardDescription className="line-clamp-3 h-[60px] text-xs">
                            {item.description}
                        </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-xs">
                    {(item.Author || item.Date) && (
                         <div className="text-muted-foreground flex flex-wrap gap-x-2">
                            {item.Author && <span>👤 {item.Author}</span>}
                            {item.Date && <span>📅 {item.Date}</span>}
                        </div>
                    )}
                     <div className="flex flex-wrap gap-1">
                        {item.Type && <Badge variant="secondary">{item.Type}</Badge>}
                        {item.Style && <Badge variant="secondary">{item.Style}</Badge>}
                        {item.Activity && <Badge variant="outline">{item.Activity}</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    {item.pdfUrl && <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary"><FileText size={14}/> PDF</a>}
                    {item.stlUrl && <a href={item.stlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary"><Download size={14}/> STL</a>}
                    {item.galleryUrls.length > 0 && <span className="flex items-center gap-1"><GalleryHorizontal size={14}/> {item.galleryUrls.length} images</span>}
                  </CardFooter>
                </Card>
            ))}
          </div>
        )}

        <div className="mt-12 w-full mx-auto bg-muted/50 p-4 rounded-lg">
          <h2 className="text-2xl font-headline font-bold mb-4 text-center">Données brutes :</h2>
          <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto max-h-[500px]">
            {JSON.stringify({ category, brand, data: finalData }, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
