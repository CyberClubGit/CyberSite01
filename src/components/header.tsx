
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const getCurrentCategorySlug = useCallback(() => {
    const pathParts = pathname.split('/').filter(p => p);
    if (pathParts.length === 0) return 'home';
    if (pathParts[0] === 'home' && pathParts.length === 1) return 'home';

    const catSlugs = categories.map(c => c.Url?.toLowerCase());

    // Look from right to left for a category slug
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (catSlugs.includes(pathParts[i]?.toLowerCase())) {
        return pathParts[i];
      }
    }
    
    // Default to home if no category is found in URL, e.g. for base path
    if (pathname === '/') return 'home';

    return 'home';
  }, [pathname, categories]);

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
    localStorage.setItem('brandSelected', brand.Brand);
    
    const currentCategorySlug = getCurrentCategorySlug() || 'home';
    
    let newPath;
    if (brand.Brand === 'Cyber Club' || !brand.Activity) {
      newPath = `/${currentCategorySlug}`;
    } else {
      newPath = `/${brand.Activity.toLowerCase()}/${currentCategorySlug}`;
    }
    
    router.push(newPath);

  }, [brands, router, getCurrentCategorySlug]);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || brands.length === 0) return;
    
    const pathParts = pathname.split('/').filter(p => p);
    const potentialBrandActivity = pathParts[0];
    const brandFromUrl = brands.find(b => b.Activity && b.Activity.toLowerCase() === potentialBrandActivity?.toLowerCase());

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
      const storedBrand = localStorage.getItem('brandSelected') || 'Cyber Club';
      if (storedBrand !== selectedBrand) {
        // This effect is now just for initialization, navigation is handled in handleBrandChange and URL parsing effect
      }
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

  const currentCategorySlug = getCurrentCategorySlug();

  const renderNavLinks = (isMobile = false) => (
    categories && categories
      .filter(category => category.Name && category.Url && category.Url.trim() !== '')
      .map((category) => {
          const linkHref = getLinkHref(category.Url.toLowerCase());
          const isActive = (currentCategorySlug || 'home').toLowerCase() === category.Url.toLowerCase();
          
          return (
            <Link
                key={category.Name}
                href={linkHref}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                className={`text-sm font-medium transition-colors hover:text-primary menu-link ${isActive ? 'active' : ''} ${isMobile ? 'block w-full text-left p-2' : ''}`}
            >
                <div className="flex items-center gap-2">
                  {category['Url Logo Png'] && (
                    <Image
                      src={category['Url Logo Png']}
                      alt={`${category.Name} logo`}
                      width={20}
                      height={20}
                      className="object-contain dark:invert"
                    />
                  )}
                  <span>{category.Name}</span>
                </div>
            </Link>
          )
      })
  );


  if (!isMounted) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                 <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        
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
        <div className="mr-auto flex items-center gap-2">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            
          </Link>
        
          <div className="hidden md:flex">
             <Select onValueChange={handleBrandChange} value={selectedBrand}>
                <SelectTrigger className="w-auto brand-selector font-headline h-14 px-4 text-lg">
                  <SelectValue placeholder="Select Brand" className="uppercase" />
                </SelectTrigger>
                <SelectContent>
                  {brands && brands.map((brand) => (
                    <SelectItem key={brand.Brand} value={brand.Brand}>
                      <div className="flex items-center gap-2 whitespace-nowrap font-headline">
                        {brand.Logo && (
                          <Image
                            src={brand.Logo}
                            alt={`${brand.Brand} logo`}
                            width={28}
                            height={28}
                            className="object-contain dark:invert"
                          />
                        )}
                        <span>{brand.Brand}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>


        <div className="hidden md:flex flex-1 items-center justify-center">
          <nav className="flex gap-6">
            {renderNavLinks()}
          </nav>
        </div>

        <div className="ml-auto flex items-center justify-end space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
            
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                   <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation menu and brand selector.</SheetDescription>
                         <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                            
                        </Link>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 p-4">
                       <Select onValueChange={(value) => { handleBrandChange(value); setIsMobileMenuOpen(false); }} value={selectedBrand}>
                          <SelectTrigger className="w-full brand-selector font-headline">
                            <SelectValue placeholder="Select Brand" className="uppercase" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands && brands.map((brand) => (
                              <SelectItem key={brand.Brand} value={brand.Brand}>
                                <div className="flex items-center gap-2 whitespace-nowrap font-headline">
                                  {brand.Logo && (
                                    <Image
                                      src={brand.Logo}
                                      alt={`${brand.Brand} logo`}
                                      width={24}
                                      height={24}
                                      className="object-contain dark:invert"
                                    />
                                  )}
                                  <span>{brand.Brand}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <nav className="flex flex-col gap-2 mt-4 border-t pt-4">
                        {renderNavLinks(true)}
                      </nav>
                    </div>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
