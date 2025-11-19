
import { getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { filterItemsByBrandActivity, getActivityForBrand } from '@/lib/activity-filter';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { VideoBackground } from './video-background';
import { VideoDebugInfo } from './video-debug-info';
import { convertGoogleDriveLinkToDirectVideo } from '@/lib/google-drive-utils';

interface DefaultPageLayoutProps {
  category: Category;
  brand?: Brand;
}

export default async function DefaultPageLayout({ category, brand }: DefaultPageLayoutProps) {
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
  
  const backgroundVideoUrl = category.Background ? convertGoogleDriveLinkToDirectVideo(category.Background) : '';

  return (
    <>
      {backgroundVideoUrl && <VideoBackground src={backgroundVideoUrl} />}
      <div className={cn("relative bg-transparent")}>
        <section className="w-full py-8 md:py-12 relative z-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none capitalize text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                  {category?.Name || 'Catégorie'}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                  {category?.Description || (brand ? `Contenu pour ${category?.Name} sous la marque ${brand.Brand}` : `Contenu à venir pour ${category?.Name}`)}
                </p>
              </div>
            </div>

            {finalData && finalData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {finalData.map((item, index) => (
                    <Card key={index} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/80 backdrop-blur-sm">
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
              <div className="mt-12 text-center text-gray-300">
                <p>Aucun élément trouvé pour cette catégorie {brand && brand.Brand !== 'Cyber Club' ? `et l'activité "${getActivityForBrand(brand.Brand)}"` : ''}.</p>
              </div>
            )}

            {/* Outils de débogage conservés en bas de page */}
            {backgroundVideoUrl && (
              <div className="mt-20 p-4 border-2 border-dashed border-yellow-500 bg-black/50 rounded-lg">
                <h2 className="text-xl font-headline text-yellow-400 mb-4">Lecteur Vidéo de Débogage :</h2>
                 <video
                  key={backgroundVideoUrl}
                  src={backgroundVideoUrl}
                  width="100%"
                  controls
                  className="bg-black mb-4"
                >
                  Votre navigateur ne supporte pas la balise vidéo.
                </video>
                <VideoDebugInfo videoUrl={backgroundVideoUrl} />
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
