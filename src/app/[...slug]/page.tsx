
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Handle root URL case
  if (slug.length === 0 || (slug.length === 1 && slug[0] === '')) {
      category = categories.find(c => c.Url && c.Url.toLowerCase() === 'home');
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
              {category?.Name}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {brand ? `Contenu pour ${category?.Name} sous la marque ${brand.Brand}` : `Contenu à venir pour ${category?.Name}`}
            </p>
          </div>
        </div>

        {categoryData && categoryData.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryData.map((item, index) => {
              // Try to find a title, fallback to the first available property
              const title = item.Title || item.Name || item.Item || Object.values(item)[0] || 'Untitled';
              const description = item.Description || `Item ${index + 1}`;
              
              return (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                    <CardDescription className="line-clamp-2">{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 text-xs text-muted-foreground">
                    <p className="line-clamp-3">
                        {Object.entries(item)
                          .filter(([key]) => key !== 'Title' && key !== 'Name' && key !== 'Item' && key !== 'Description')
                          .slice(0, 3)
                          .map(([key, value]) => `${key}: ${value || 'N/A'}`)
                          .join(' | ')
                        }
                    </p>
                  </CardContent>
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
