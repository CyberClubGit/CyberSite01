
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';

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
