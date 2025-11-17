'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const [fetchedCategories, fetchedBrands] = await Promise.all([
        getCategories(),
        getBrands(),
      ]);
      setCategories(fetchedCategories);
      setBrands(fetchedBrands);
      console.log('Fetched Categories:', fetchedCategories);
      console.log('Fetched Brands:', fetchedBrands);
    }
    fetchData();

    const storedBrand = localStorage.getItem('brandSelected');
    if (storedBrand) {
      handleBrandChange(storedBrand, true);
    }

    const storedTheme = localStorage.getItem('darkMode');
    if (storedTheme) {
      setTheme(JSON.parse(storedTheme) ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(theme === 'dark'));
  }, [theme]);
  
  useEffect(() => {
    const brandFromUrl = pathname.split('/')[1];
    const brandObject = brands.find(b => b.Activity === brandFromUrl);
    if (brandObject && brandObject.Brand !== selectedBrand) {
        handleBrandChange(brandObject.Brand, true);
    } else if (!brandFromUrl || brandFromUrl === 'home' || categories.find(c => c.Url === brandFromUrl)) {
        if(selectedBrand !== 'Cyber Club') {
            handleBrandChange('Cyber Club', true);
        }
    }
  }, [pathname, brands]);

  const handleBrandChange = (brandName: string, fromUrl = false) => {
    const brand = brands.find(b => b.Brand === brandName) || brands.find(b => b.Brand === 'Cyber Club');
    if (!brand) return;

    setSelectedBrand(brand.Brand);
    localStorage.setItem('brandSelected', brand.Brand);
    document.documentElement.style.setProperty('--brand-color', brand.Color);

    if (!fromUrl) {
      const currentPathParts = pathname.split('/').filter(p => p);
      const isCategoryUrl = categories.some(c => c.Url === currentPathParts[currentPathParts.length - 1]);
      
      let newPath;
      if (brand.Brand === 'Cyber Club') {
        if(isCategoryUrl) {
           newPath = `/${currentPathParts[currentPathParts.length - 1]}`;
        } else {
           newPath = '/home';
        }
      } else {
         if(isCategoryUrl) {
            newPath = `/${brand.Activity}/${currentPathParts[currentPathParts.length - 1]}`;
         } else {
            newPath = `/${brand.Activity}/home`;
         }
      }
      router.push(newPath);
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold font-headline text-lg">CYBER CLUB</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-start space-x-2">
          <Select onValueChange={(value) => handleBrandChange(value)} value={selectedBrand}>
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
                  const isActive = pathname.endsWith(`/${category.Url}`) || (pathname === '/' && category.Url === 'home') || pathname.endsWith(`/${category.Url}/`);
                  return (
                    <Link
                        key={category.Item}
                        href={getLinkHref(category.Url)}
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
