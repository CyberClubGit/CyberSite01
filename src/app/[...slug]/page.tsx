
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';

export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  
  const brands = await getBrands();
  const categories = await getCategories();

  let brand: Brand | undefined;
  let category: Category | undefined;
  let categorySlug: string | undefined;

  // Find category slug - it can be the first or second part of the URL
  const potentialCatSlug1 = slug[0];
  const potentialCatSlug2 = slug[1];

  const cat1 = categories.find(c => c.Slug && c.Slug.toLowerCase() === potentialCatSlug1?.toLowerCase());
  const cat2 = categories.find(c => c.Slug && c.Slug.toLowerCase() === potentialCatSlug2?.toLowerCase());

  if (cat2) {
    category = cat2;
    categorySlug = potentialCatSlug2;
    const potentialBrandSlug = potentialCatSlug1;
    brand = brands.find(b => b.Activity && b.Activity.toLowerCase() === potentialBrandSlug?.toLowerCase());
  } else if (cat1) {
    category = cat1;
    categorySlug = potentialCatSlug1;
    // No brand in this case
  } else if (slug[0] === 'home') {
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
