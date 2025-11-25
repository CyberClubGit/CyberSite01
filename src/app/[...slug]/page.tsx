
import { getBrands, getCategories, getCategoryData, processGalleryLinks, type Brand, type Category } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import { CatalogPageClient } from '@/components/catalog-page-client';
import DefaultPageLayout from '@/components/default-page-layout';
import { HomePageClient } from '@/components/home-page-client';
import AdminOrdersPage from '../admin/orders/page';

export async function generateStaticParams() {
  const categories = await getCategories();
  const brands = await getBrands();
  
  const paths: { slug: string[] }[] = [];

  // Default paths without brand
  categories.forEach(category => {
    if (category.Url) {
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
        // Exclude /brand/tools route
        if (category.Url && category.Url.toLowerCase() !== 'home' && category.Url.toLowerCase() !== 'tools') {
          paths.push({ slug: [brand.Activity.toLowerCase(), category.Url.toLowerCase()] });
        }
      });
    }
  });
  
  // Ensure the root path '/' handled by /home is considered
  if (!paths.some(p => p.slug.length === 1 && p.slug[0] === 'home')) {
     paths.push({ slug: ['home'] });
  }

  // Add profile path
  paths.push({ slug: ['profile'] });
  
  // Add admin path
  paths.push({ slug: ['admin', 'orders'] });

  return paths;
}

export default async function CatchAllPage({ params }: { params: { slug:string[] } }) {
  const slugArray = params.slug || [];

  // Handle admin route specifically
  if (slugArray.join('/') === 'admin/orders') {
    return <AdminOrdersPage />;
  }
  
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

  // If the page is "Tools", we don't apply brand filtering in the routing logic
  if (lastSlugPart.toLowerCase() === 'tools') {
      brand = undefined;
  }

  if (!category || !category.Url) {
    // Before triggering a 404, check if it's the profile page
    if (slugArray.join('/') === 'profile') {
        const ProfilePage = (await import('../profile/page')).default;
        return <ProfilePage />;
    }
    notFound();
  }
  
  // Specific layout for the Home page
  if (category.Url.toLowerCase() === 'home') {
    return <HomePageClient category={category} brand={brand} />;
  }
  
  // Get raw data for the current category
  const rawCategoryData = await getCategoryData(category.Url);

  // Process data for all pages (this includes link conversion and normalization)
  const processedData = rawCategoryData.map(item => {
    const processedItem = processGalleryLinks(item);
    
    // CRITICAL: ID NORMALIZATION
    // This logic is now applied to all data, ensuring consistency.
    let validId = (item.ID || item.Id || item.id || '').trim();
    if (!validId || validId === '#NAME?') {
      validId = processedItem.title;
    }
    
    return {
      ...processedItem,
      id: validId, // Standardized ID field
    };
  });
  
  // Specific layout for the Catalog page - Data source from Google Sheets
  if (category.Url.toLowerCase() === 'catalog') {
    // Extract filters from the raw sheet data (which is fine)
    const types = [...new Set(rawCategoryData.map(p => p.Type).filter(Boolean) as string[])];
    const materials = [...new Set(rawCategoryData.map(p => p.Material).filter(Boolean) as string[])];
    
    return (
      <CatalogPageClient 
        initialData={processedData} // Pass the fully processed data
        category={category}
        brand={brand}
        types={types}
        materials={materials}
      />
    );
  }
  
  // For all other pages (including Projects, Tools, etc.)
  return <DefaultPageLayout category={category} brand={brand} initialData={processedData} brands={brands} />;
}
