'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getBrands, getCategories, type Brand, type Category } from '@/lib/sheets';
import { usePathname, useRouter } from 'next/navigation';

export function Header() {
  const { setTheme, theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('Cyber Club');
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      const [fetchedCategories, fetchedBrands] = await Promise.all([
        getCategories(),
        getBrands(),
      ]);
      setCategories(fetchedCategories);
      setBrands(fetchedBrands);
      console.log('Fetched Categories:', fetchedCategories);
      console.log('Fetched Brands:', fetchedBrands);

      // Initialize brand from localStorage or URL after data is fetched
      const storedBrand = localStorage.getItem('brandSelected');
      const brandFromUrl = pathname.split('/')[1];
      const brandObjectFromUrl = fetchedBrands.find(b => b.Activity === brandFromUrl);

      if (brandObjectFromUrl) {
          handleBrandChange(brandObjectFromUrl.Brand, true, fetchedBrands);
      } else if (storedBrand) {
        handleBrandChange(storedBrand, true, fetchedBrands);
      } else {
        handleBrandChange('Cyber Club', true, fetchedBrands);
      }
    }
    fetchData();

    const storedTheme = localStorage.getItem('darkMode');
    if (storedTheme) {
      setTheme(JSON.parse(storedTheme) ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('darkMode', JSON.stringify(theme === 'dark'));
    }
  }, [theme, isMounted]);

  useEffect(() => {
    if (brands.length === 0) return;

    const pathParts = pathname.split('/').filter(p => p);
    const brandFromUrl = pathParts[0];
    const categoryFromUrl = pathParts.length > 1 ? pathParts[1] : (pathParts.length === 1 ? pathParts[0] : null);

    const brandObject = brands.find(b => b.Activity === brandFromUrl);

    if (brandObject) { // URL has a brand
        if (brandObject.Brand !== selectedBrand) {
            handleBrandChange(brandObject.Brand, true, brands);
        }
    } else if (categoryFromUrl && categories.some(c => c.Url === categoryFromUrl)) { // URL has only category
        if (selectedBrand !== 'Cyber Club') {
            handleBrandChange('Cyber Club', true, brands);
        }
    }
  }, [pathname, brands, categories]);


  const handleBrandChange = (brandName: string, fromUrl = false, brandList: Brand[]) => {
    const allBrands = brandList.length > 0 ? brandList : brands;
    const brand = allBrands.find(b => b.Brand === brandName) || allBrands.find(b => b.Brand === 'Cyber Club');
    if (!brand) return;

    setSelectedBrand(brand.Brand);
    if (isMounted) {
      localStorage.setItem('brandSelected', brand.Brand);
      document.documentElement.style.setProperty('--brand-color', brand.Color);
    }
    
    if (!fromUrl) {
      const currentPathParts = pathname.split('/').filter(p => p);
      let categorySlug = 'home'; // default
      
      // Find current category from URL
      if (currentPathParts.length > 0) {
        const potentialCategory = currentPathParts[currentPathParts.length - 1];
        if (categories.some(c => c.Url === potentialCategory)) {
          categorySlug = potentialCategory;
        }
      }
      
      let newPath;
      if (brand.Brand === 'Cyber Club') {
        newPath = `/${categorySlug}`;
      } else {
        newPath = `/${brand.Activity}/${categorySlug}`;
      }
      
      if (newPath !== pathname) {
        router.push(newPath);
      }
    }
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const getLinkHref = (categoryUrl: string) => {
    const brand = brands.find(b => b.Brand === selectedBrand);
    if (brand && brand.Brand !== 'Cyber Club') {
      return `/${brand.Activity}/${categoryUrl}`;
    }
    return `/${categoryUrl}`;
  };

  if (!isMounted) {
    return null; // or a loading skeleton
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold font-headline text-lg">CYBER CLUB</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-start space-x-2">
          <Select onValueChange={(value) => handleBrandChange(value, false, brands)} value={selectedBrand}>
            <SelectTrigger className="w-[150px] brand-selector">
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.Brand} value={brand.Brand}>
                  {brand.Brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 items-center justify-center space-x-6">
          <nav className="hidden md:flex gap-6">
            {categories
              .filter(category => category.Item && category.Url)
              .map((category) => {
                  const linkHref = getLinkHref(category.Url);
                  const isActive = pathname === linkHref;
                  return (
                    <Link
                        key={category.Item}
                        href={linkHref}
                        className={`text-sm font-medium transition-colors hover:text-primary menu-link ${isActive ? 'active' : ''}`}
                    >
                        {category.Item}
                    </Link>
                  )
              })}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
          {/* Placeholder for User Menu */}
        </div>
      </div>
    </header>
  );
}
