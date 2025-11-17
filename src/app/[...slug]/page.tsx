
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';

export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  
  const brands = await getBrands();
  const categories = await getCategories();

  let brand: Brand | undefined;
  let category: Category | undefined;

  const brandSlug = slug.length > 1 ? slug[0] : undefined;
  const potentialCategorySlugFromBrandRoute = slug.length > 1 ? slug[1] : undefined;
  const potentialCategorySlugFromBaseRoute = slug.length > 0 ? slug[0] : undefined;

  if (brandSlug) {
      brand = brands.find(b => b.Activity && b.Activity.toLowerCase() === brandSlug.toLowerCase());
  }

  if (brand && potentialCategorySlugFromBrandRoute) {
      category = categories.find(c => c.Slug && c.Slug.toLowerCase() === potentialCategorySlugFromBrandRoute.toLowerCase());
  } else if (potentialCategorySlugFromBaseRoute) {
      category = categories.find(c => c.Slug && c.Slug.toLowerCase() === potentialCategorySlugFromBaseRoute.toLowerCase());
  }
  
  // Handle /home route specifically if no other category matches
  if (!category && potentialCategorySlugFromBaseRoute && potentialCategorySlugFromBaseRoute === 'home') {
    category = categories.find(c => c.Slug && c.Slug.toLowerCase() === 'home');
  }

  if (!category) {
    notFound();
  }
  
  const categoryData = await getCategoryData(category['Url Sheet']);

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none capitalize">
              {category?.Name}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {brand 
                ? `Contenu à venir pour ${category?.Name} sous la marque ${brand.Brand}`
                : `Contenu à venir pour ${category?.Name}`}
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
