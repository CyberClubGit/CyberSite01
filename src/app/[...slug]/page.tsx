
import { getBrands, getCategories, getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import { CatalogPageClient } from '@/components/catalog-page-client';
import DefaultPageLayout from '@/components/default-page-layout';
import { HomePageClient } from '@/components/home-page-client';

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
  const processedData = rawCategoryData.map(processGalleryLinks);
  
  // Specific layout for the Home page
  if (category.Url.toLowerCase() === 'home') {
    return <HomePageClient category={category} brand={brand} />;
  }

  // Specific layout for the Catalog page
  if (category.Url.toLowerCase() === 'catalog') {
    const types = [...new Set(rawCategoryData.map(item => item.Type).filter(Boolean) as string[])];
    const materials = [...new Set(rawCategoryData.map(item => item.Material).filter(Boolean) as string[])];

    return (
      <CatalogPageClient 
        initialData={processedData} 
        category={category}
        brand={brand}
        types={types}
        materials={materials}
      />
    );
  }
  
  // For all other pages (including Projects)
  return <DefaultPageLayout category={category} brand={brand} initialData={processedData} brands={brands} />;
}
