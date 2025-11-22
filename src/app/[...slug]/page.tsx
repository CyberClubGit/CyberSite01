
import { getBrands, getCategories, getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import { CatalogPageClient } from '@/components/catalog-page-client';
import DefaultPageLayout from '@/components/default-page-layout';
import { HomePageClient } from '@/components/home-page-client';

export async function generateStaticParams() {
  const categories = await getCategories();
  const brands = await getBrands();
  
  const paths: { slug: string[] }[] = [];

  // Default paths without brand
  categories.forEach(category => {
    if (category.Url) {
      // Handle home page specifically if its slug is 'home'
      if (category.Url.toLowerCase() === 'home') {
        paths.push({ slug: ['home'] });
      } else {
        paths.push({ slug: [category.Url.toLowerCase()] });
      }
    }
  });

  // Paths with brand
  brands.forEach(brand => {
    if (brand.Activity && brand.Brand !== 'Cyber Club') {
      categories.forEach(category => {
        if (category.Url && category.Url.toLowerCase() !== 'home') { // Avoid /brand/home routes
          paths.push({ slug: [brand.Activity.toLowerCase(), category.Url.toLowerCase()] });
        }
      });
    }
  });
  
  // Ensure the root path '/' handled by /home is considered
  // The redirect in page.tsx handles the root, but generateStaticParams needs to know about /home
  if (!paths.some(p => p.slug.length === 1 && p.slug[0] === 'home')) {
     paths.push({ slug: ['home'] });
  }

  // Add profile path
  paths.push({ slug: ['profile'] });

  return paths;
}

export default async function CatchAllPage({ params }: { params: { slug:string[] } }) {
  const slugArray = params.slug || [];
  
  const categories = await getCategories();
  const brands = await getBrands();

  let brand: Brand | undefined;
  let category: Category | undefined;
  
  const lastSlugPart = slugArray.length > 0 ? slugArray[slugArray.length - 1] : 'home';
  const potentialBrandSlug = slugArray.length > 1 ? slugArray[0] : undefined;
  
  category = categories.find(c => c.Url && c.Url.toLowerCase() === lastSlugPart.toLowerCase());

  if (potentialBrandSlug) {
      brand = brands.find(b => b.Activity && b.Activity.toLowerCase() === potentialBrandSlug.toLowerCase());
  }

  if (!category || !category.Url) {
    notFound();
  }
  
  // Specific layout for the Home page
  if (category.Url.toLowerCase() === 'home') {
    return <HomePageClient category={category} brand={brand} />;
  }

  // Specific layout for the Catalog page - Data source from Google Sheets
  if (category.Url.toLowerCase() === 'catalog') {
    const rawCategoryData = await getCategoryData(category.Url);
    
    // Server-side data processing to ensure data integrity
    const processedData = rawCategoryData.map(item => {
      const processedItem = processGalleryLinks(item);
      
      // **THE FIX**: Normalize the ID, making it case-insensitive.
      // It looks for 'ID', 'Id', or 'id' and standardizes it to a single 'ID' property.
      const normalizedId = item.ID || item.Id || item.id || '';

      return {
        ...processedItem,
        ID: normalizedId, 
        title: processedItem.title, // Ensure title is standardized
      };
    });
    
    // Extract filters from the raw sheet data
    const types = [...new Set(rawCategoryData.map(p => p.Type).filter(Boolean) as string[])];
    const materials = [...new Set(rawCategoryData.map(p => p.Material).filter(Boolean) as string[])];
    
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
  const rawCategoryData = await getCategoryData(category.Url);
  const processedData = rawCategoryData.map(processGalleryLinks);
  return <DefaultPageLayout category={category} brand={brand} initialData={processedData} brands={brands} />;
}
