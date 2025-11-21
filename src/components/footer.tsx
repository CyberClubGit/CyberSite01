'use client';

import Link from 'next/link';
import { Network } from 'lucide-react';
import { ThemeToggleButton } from './theme-toggle-button';


export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="container py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Colonne 1: Logo & Description */}
          <div>
            <h3 className="font-headline text-xl mb-4">CYBER CLUB</h3>
            <p className="text-sm text-muted-foreground">
              Portfolio dynamique alimenté par Google Sheets
            </p>
          </div>

          {/* Colonne 2: Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary">Accueil</Link></li>
              <li><Link href="/projects" className="hover:text-primary">Projets</Link></li>
              <li><Link href="/catalog" className="hover:text-primary">Catalogue</Link></li>
              <li><Link href="/research" className="hover:text-primary">Recherche</Link></li>
            </ul>
          </div>

          {/* Colonne 3: Légal */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/privacy" className="hover:text-primary">Confidentialité</Link></li>
              <li><Link href="/legal/terms" className="hover:text-primary">CGU</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          {/* Colonne 4: Dev Tools */}
          <div>
            <h4 className="font-semibold mb-4">Développement</h4>
            <Link 
              href="/dev/sitemap" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
            >
              <Network className="w-4 h-4" />
              Arborescence du site
            </Link>
          </div>
        </div>

        {/* Copyright & Toggles */}
        <div className="border-t mt-8 pt-8 flex justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CYBER CLUB. Tous droits réservés.</p>
           <div className="ml-auto flex items-center gap-2">
                <ThemeToggleButton />
            </div>
        </div>
      </div>
    </footer>
  );
}
