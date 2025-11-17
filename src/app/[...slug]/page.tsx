
import { getBrands, getCategories, type Brand, type Category } from '@/lib/sheets';

export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  let brandName: string | undefined;
  let categoryName: string | undefined;

  const brands = await getBrands();
  const categories = await getCategories();

  const isBrand = (slug: string) => brands.some(b => b.Activity === slug);
  const isCategory = (slug: string) => categories.some(c => c.Url === slug);
  
  if (slug.length === 1 && isCategory(slug[0])) {
    categoryName = slug[0];
  } else if (slug.length === 2 && isBrand(slug[0]) && isCategory(slug[1])) {
    brandName = slug[0];
    categoryName = slug[1];
  } else {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-6 text-center">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                            Page non trouvée
                        </h1>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                            Désolé, nous n'avons pas pu trouver la page que vous recherchez.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none capitalize">
              {categoryName?.replace('-', ' ')}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              {brandName 
                ? `Contenu à venir pour ${categoryName?.replace('-', ' ')} sous la marque ${brandName}`
                : `Contenu à venir pour ${categoryName?.replace('-', ' ')}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
