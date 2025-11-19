
import { getBrands, getCategories, getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import { CatalogPageClient } from '@/components/catalog-page-client';

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

  // Si ce n'est pas la page catalogue, on utilise l'ancien rendu simple
  if (category.Url.toLowerCase() !== 'catalog') {
    const { default: DefaultPageLayout } = await import('@/components/default-page-layout');
    return <DefaultPageLayout category={category} brand={brand} />;
  }
  
  // Logique spécifique pour la page Catalogue
  const rawCategoryData = await getCategoryData(category.Url);
  
  // Extraire les valeurs uniques pour les filtres
  const types = [...new Set(rawCategoryData.map(item => item.Type).filter(Boolean) as string[])];
  const materials = [...new Set(rawCategoryData.map(item => item.Material).filter(Boolean) as string[])];

  return (
    <CatalogPageClient 
      initialData={rawCategoryData} 
      category={category}
      brand={brand}
      types={types}
      materials={materials}
    />
  );
}

