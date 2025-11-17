
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';

export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  let brandActivity: string | undefined;
  let categorySlug: string | undefined;

  const brands = await getBrands();
  const categories = await getCategories();

  const getBrandByActivity = (activity: string) => brands.find(b => b.Activity === activity);
  const getCategoryBySlug = (slug: string) => categories.find(c => c.Url === slug);

  if (slug.length === 1) {
    if (getCategoryBySlug(slug[0])) {
      categorySlug = slug[0];
    }
  } else if (slug.length === 2) {
    if (getBrandByActivity(slug[0]) && getCategoryBySlug(slug[1])) {
      brandActivity = slug[0];
      categorySlug = slug[1];
    }
  }

  if (!categorySlug) {
    notFound();
  }

  const category = getCategoryBySlug(categorySlug);
  const brand = brandActivity ? getBrandByActivity(brandActivity) : undefined;
  
  const categoryData = await getCategoryData(category?.['Url Sheet'] || '');

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none capitalize">
              {category?.Item}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {brand 
                ? `Contenu à venir pour ${category?.Item} sous la marque ${brand.Brand}`
                : `Contenu à venir pour ${category?.Item}`}
            </p>
          </div>
        </div>
        <div className="mt-12 w-full mx-auto bg-muted/50 p-4 rounded-lg">
            <h2 className="text-2xl font-headline font-bold mb-4 text-center">Données brutes de la feuille :</h2>
            <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto">
                {JSON.stringify(categoryData, null, 2)}
            </pre>
        </div>
      </div>
    </section>
  );
}