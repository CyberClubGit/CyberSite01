
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

  const handleBrandChange = useCallback((brandName: string) => {
    const brand = brands.find(b => b.Brand === brandName) || brands.find(b => b.Brand === 'Cyber Club');
    
    if (!brand) return;

    setSelectedBrand(brand.Brand);
    if (isMounted) {
      localStorage.setItem('brandSelected', brand.Brand);
    }
    
    const pathParts = pathname.split('/').filter(p => p);
    let categorySlug = 'home';
    
    if (pathParts.length > 0) {
      const isBrandSlug = (slug: string) => brands.some(b => b.Activity.toLowerCase() === slug.toLowerCase());
      
      let potentialCategorySlug = pathParts[0];
      if (pathParts.length > 1 && isBrandSlug(pathParts[0])) {
        potentialCategorySlug = pathParts[1];
      }
      
      const isCategory = categories.some(c => c.Slug.toLowerCase() === potentialCategorySlug.toLowerCase());
      if(isCategory) {
        categorySlug = potentialCategorySlug;
      } else if (pathParts.length > 0) {
        // Fallback for case where only category is present
        const categoryMatch = categories.find(c => c.Slug.toLowerCase() === pathParts[pathParts.length - 1].toLowerCase());
        if (categoryMatch) {
          categorySlug = categoryMatch.Slug;
        }
      }
    }
    
    let newPath;
    if (brand.Brand === 'Cyber Club') {
      newPath = `/${categorySlug}`;
    } else {
      newPath = `/${brand.Activity.toLowerCase()}/${categorySlug}`;
    }
    
    router.push(newPath);

  }, [isMounted, brands, pathname, router, categories]);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || brands.length === 0) return;
    
    const pathParts = pathname.split('/').filter(p => p);
    const potentialBrandActivity = pathParts.length > 1 ? pathParts[0] : undefined;
    const brandFromUrl = potentialBrandActivity ? brands.find(b => b.Activity.toLowerCase() === potentialBrandActivity.toLowerCase()) : undefined;

    const currentBrandName = brandFromUrl ? brandFromUrl.Brand : 'Cyber Club';

    if (selectedBrand !== currentBrandName) {
      setSelectedBrand(currentBrandName);
      localStorage.setItem('brandSelected', currentBrandName);
    }
    
    const brandToApply = brands.find(b => b.Brand === currentBrandName);
    applyBrandColor(brandToApply, resolvedTheme);

  }, [isMounted, brands, pathname, resolvedTheme, applyBrandColor, selectedBrand]);


  useEffect(() => {
    if (isMounted) {
      const currentBrand = brands.find(b => b.Brand === selectedBrand);
      applyBrandColor(currentBrand, resolvedTheme);
    }
  }, [theme, isMounted, resolvedTheme, applyBrandColor, brands, selectedBrand]);
  

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const getLinkHref = (categoryUrl: string) => {
    const brand = brands.find(b => b.Brand === selectedBrand);
    if (brand && brand.Brand !== 'Cyber Club' && brand.Activity) {
      return `/${brand.Activity.toLowerCase()}/${categoryUrl}`;
    }
    return `/${categoryUrl}`;
  };

  if (!isMounted) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
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
          <Select onValueChange={handleBrandChange} value={selectedBrand}>
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
              .filter(category => category.Name && category.Slug)
              .map((category) => {
                  const linkHref = getLinkHref(category.Slug);
                  const pathParts = pathname.split('/').filter(p => p);
                  const currentCategorySlug = pathParts.length > 1 && brands.some(b => b.Activity.toLowerCase() === pathParts[0].toLowerCase())
                    ? pathParts[1]
                    : pathParts[0];

                  const isActive = (currentCategorySlug || 'home').toLowerCase() === category.Slug.toLowerCase();
                  
                  return (
                    <Link
                        key={category.Name}
                        href={linkHref}
                        className={`text-sm font-medium transition-colors hover:text-primary menu-link ${isActive ? 'active' : ''}`}
                    >
                        {category.Name}
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

