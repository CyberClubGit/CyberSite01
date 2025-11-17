
import { getBrands, getCategories, getCategoryData, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const CatalogGrid = ({ items }: { items: any[] }) => {
  if (!items || items.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">Le catalogue est actuellement vide.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <Card key={index} className="flex flex-col">
          <CardHeader>
             {item.Image && (
              <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-lg">
                <Image 
                  src={item.Image.startsWith('http') ? item.Image : `https://picsum.photos/seed/${index+100}/400/400`} 
                  alt={item.Name || 'Image du produit'} 
                  fill
                  className="object-cover"
                  data-ai-hint="product image"
                />
              </div>
            )}
            <CardTitle className="font-headline text-xl">{item.Name || 'Produit sans nom'}</CardTitle>
            {item.Price && <p className="text-lg font-semibold">{item.Price}</p>}
          </CardHeader>
          <CardContent className="flex-1">
            <CardDescription>{item.Description || 'Aucune description disponible.'}</CardDescription>
          </CardContent>
          {item.Link && (
            <CardFooter>
                <a href={item.Link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                    Voir le produit
                </a>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};


export default async function CatchAllPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  
  const categories = await getCategories();
  const brands = await getBrands();

  let brand: Brand | undefined;
  let category: Category | undefined;
  
  const lastSlugPart = slug.length > 0 ? slug[slug.length - 1] : 'home';
  const potentialBrandSlug = slug.length > 1 ? slug[0] : undefined;
  
  category = categories.find(c => c.Slug && c.Slug.toLowerCase() === lastSlugPart.toLowerCase());

  if (potentialBrandSlug) {
      brand = brands.find(b => b.Activity && b.Activity.toLowerCase() === potentialBrandSlug.toLowerCase());
  }

  // Handle root URL case
  if (slug.length === 0 || slug[0] === '') {
      category = categories.find(c => c.Slug && c.Slug.toLowerCase() === 'home');
  }


  if (!category) {
    notFound();
  }
  
  const categoryData = await getCategoryData(category['Url Sheet']);
  const isCatalogPage = category.Name.toLowerCase() === 'catalog';

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none capitalize">
              {category?.Name}
            </h1>
             {!isCatalogPage && (
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                {brand 
                    ? `Contenu à venir pour ${category?.Name} sous la marque ${brand.Brand}`
                    : `Contenu à venir pour ${category?.Name}`}
                </p>
            )}
          </div>
        </div>
        
        {isCatalogPage ? (
          <CatalogGrid items={categoryData} />
        ) : (
           <div className="mt-12 w-full mx-auto bg-muted/50 p-4 rounded-lg">
              <h2 className="text-2xl font-headline font-bold mb-4 text-center">Données brutes de la feuille :</h2>
              <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto">
                  {JSON.stringify({ category, brand, data: categoryData }, null, 2)}
              </pre>
          </div>
        )}
      </div>
    </section>
  );
}
