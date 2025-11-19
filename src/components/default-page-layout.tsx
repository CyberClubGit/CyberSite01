
import { getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { filterItemsByBrandActivity, getActivityForBrand } from '@/lib/activity-filter';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoBackground } from './video-background';
import { cn } from '@/lib/utils';

interface DefaultPageLayoutProps {
  category: Category;
  brand?: Brand;
}

export default async function DefaultPageLayout({ category, brand }: DefaultPageLayoutProps) {
  const hasBackgroundVideo = category.Background && category.Background.length > 0;

  if (!category.Url) {
    return (
      <div className={cn("min-h-full bg-background")}>
        <section className="w-full py-8 md:py-12">
            <div className="container px-4 md:px-6 text-center">
                <p>Catégorie invalide.</p>
            </div>
        </section>
      </div>
    );
  }

  const rawCategoryData = await getCategoryData(category.Url);
  const filteredData = filterItemsByBrandActivity(rawCategoryData, brand?.Brand);
  const categoryData = filteredData.map(processGalleryLinks);

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
    <>
      <div className={cn(
        "relative",
        hasBackgroundVideo ? "bg-transparent" : "bg-background"
      )}>
        <section className="w-full py-8 md:py-12">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
              
              {/* === BOÎTE DE DÉBOGAGE VIDÉO === */}
              {category.Background && (
                <div className="w-full max-w-md border-2 border-red-500 p-2 my-4">
                  <p className="text-sm text-red-500 mb-2">Boîte de débogage vidéo :</p>
                  <video 
                    key={category.Background}
                    width="100%" 
                    controls 
                    muted 
                    autoPlay 
                    loop 
                    playsInline
                    className="bg-black"
                  >
                    <source src={category.Background} type="video/mp4" />
                    Votre navigateur ne supporte pas la balise vidéo.
                  </video>
                </div>
              )}
              {/* ================================ */}

              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none capitalize">
                  {category?.Name || 'Catégorie'}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  {category?.Description || (brand ? `Contenu pour ${category?.Name} sous la marque ${brand.Brand}` : `Contenu à venir pour ${category?.Name}`)}
                </p>
              </div>
            </div>

            {finalData && finalData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          </div>
        </section>
      </div>
    </>
  );
}
