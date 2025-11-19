
import { getBrands, getCategories, getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, GalleryHorizontal } from 'lucide-react';
import { filterItemsByBrandActivity, getActivityForBrand, parseItemActivities } from '@/lib/activity-filter';


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

  // ✅ FILTRER les données par activité de la marque sélectionnée
  const filteredData = filterItemsByBrandActivity(rawCategoryData, brand?.Brand);
  
  // Utiliser processGalleryLinks pour nettoyer et structurer les données filtrées
  const categoryData = filteredData.map(processGalleryLinks);

  // Déterminer une image à afficher et un titre pour chaque item
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
            {brand && brand.Brand !== 'Cyber Club' && (
              <p className="text-sm text-primary">
                Affichage de {finalData.length} sur {rawCategoryData.length} éléments pour l'activité : "{getActivityForBrand(brand.Brand)}"
              </p>
            )}
          </div>
        </div>

        {finalData && finalData.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {finalData.map((item, index) => (
                <Card key={index} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  {item.displayImageUrl && (
                    <div className="relative w-full aspect-[3/4] bg-muted">
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
                  </CardHeader>
                </Card>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center text-muted-foreground">
            <p>Aucun élément trouvé pour cette catégorie {brand && brand.Brand !== 'Cyber Club' ? `et l'activité "${getActivityForBrand(brand.Brand)}"` : ''}.</p>
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
