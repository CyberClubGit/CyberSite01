'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
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
import { type Brand, type Category } from '@/lib/sheets';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  categories: Category[];
  brands: Brand[];
}

export function Header({ categories, brands }: HeaderProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [selectedBrand, setSelectedBrand] = useState<string>('Cyber Club');
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const applyBrandColor = useCallback((brand: Brand | undefined, currentTheme: string | undefined) => {
    if (!brand || !currentTheme) return;

    const isDarkMode = currentTheme === 'dark';
    let brandColor = isDarkMode ? brand['Color Dark'] : brand['Color Light'];

    if (brandColor && !brandColor.startsWith('#')) {
      brandColor = `#${brandColor}`;
    }

    const colorToSet = brandColor || (isDarkMode ? '#FFFFFF' : '#000000');
    document.documentElement.style.setProperty('--brand-color', colorToSet);
  }, []);

  const handleBrandChange = useCallback((brandName: string, fromUrl = false) => {
    const brand = brands.find(b => b.Brand === brandName) || brands.find(b => b.Brand === 'Cyber Club');
    
    if (!brand) return;

    setSelectedBrand(brand.Brand);
    applyBrandColor(brand, resolvedTheme);

    if (isMounted) {
      localStorage.setItem('brandSelected', brand.Brand);
    }
    
    if (!fromUrl) {
      const currentPathParts = pathname.split('/').filter(p => p);
      let categorySlug = 'home';
      
      if (currentPathParts.length > 0) {
          const potentialCategorySlug = currentPathParts[currentPathParts.length - 1];
          if (categories.some(c => c.Url === potentialCategorySlug)) {
            categorySlug = potentialCategorySlug;
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
  }, [isMounted, brands, categories, pathname, router, applyBrandColor, resolvedTheme]);

  useEffect(() => {
    setIsMounted(true);

    const storedBrand = localStorage.getItem('brandSelected') || 'Cyber Club';
    const brandFromUrlSlug = pathname.split('/')[1];
    const brandFromUrl = brands.find(b => b.Activity === brandFromUrlSlug);
    
    let initialBrandName = 'Cyber Club';
    if (brandFromUrl) {
        initialBrandName = brandFromUrl.Brand;
    } else if (storedBrand && brands.some(b => b.Brand === storedBrand)) {
      initialBrandName = storedBrand;
    }

    const initialBrand = brands.find(b => b.Brand === initialBrandName) || brands.find(b => b.Brand === 'Cyber Club');
    if (initialBrand) {
      setSelectedBrand(initialBrand.Brand);
      applyBrandColor(initialBrand, resolvedTheme);
    }
    
    const pathParts = pathname.split('/').filter(p => p);
    const currentCategorySlug = pathParts.length > 1 ? pathParts[1] : pathParts[0];

    if (initialBrand && initialBrand.Brand !== 'Cyber Club' && !brandFromUrl) {
      const categoryToUse = currentCategorySlug || 'home';
      router.push(`/${initialBrand.Activity}/${categoryToUse}`);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('darkMode', JSON.stringify(theme === 'dark'));
      const currentBrand = brands.find(b => b.Brand === selectedBrand);
      applyBrandColor(currentBrand, resolvedTheme);
    }
  }, [theme, isMounted, resolvedTheme, applyBrandColor, brands, selectedBrand]);
  
  useEffect(() => {
    if (!isMounted || brands.length === 0) return;

    const pathParts = pathname.split('/').filter(p => p);
    const brandActivityFromUrl = pathParts.length > 1 ? pathParts[0] : undefined;
    
    const brandFromUrl = brands.find(b => b.Activity === brandActivityFromUrl);

    if (brandFromUrl) {
        if (brandFromUrl.Brand !== selectedBrand) {
            handleBrandChange(brandFromUrl.Brand, true);
        }
    } else {
        if (selectedBrand !== 'Cyber Club') {
             handleBrandChange('Cyber Club', true);
        }
    }
  }, [pathname, brands, isMounted, selectedBrand, handleBrandChange]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const getLinkHref = (categoryUrl: string) => {
    const brand = brands.find(b => b.Brand === selectedBrand);
    if (brand && brand.Brand !== 'Cyber Club' && brand.Activity) {
      return `/${brand.Activity}/${categoryUrl}`;
    }
    return `/${categoryUrl}`;
  };

  if (!isMounted) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                 <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="font-bold font-headline text-lg">CYBER CLUB</span>
                    </Link>
                </div>
                 <div className="flex flex-1 items-center justify-end space-x-4">
                 </div>
            </div>
        </header>
    );
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
          <Select onValueChange={(value) => handleBrandChange(value, false)} value={selectedBrand}>
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
                  const isActive = pathname === linkHref || (pathname.endsWith(`/${category.Url}`) && !pathname.startsWith('/home') && category.Url !== 'home');
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
