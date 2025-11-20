import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTree, Folder, File, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';


// Liste statique des routes (à maintenir manuellement)
const ROUTES = {
  public: [
    { path: '/', label: 'Home', description: 'Page d\'accueil' },
    { path: '/projects', label: 'Projects', description: 'Liste des projets' },
    { path: '/catalog', label: 'Catalog', description: 'Catalogue produits' },
    { path: '/research', label: 'Research', description: 'Publications recherche' },
    { path: '/events', label: 'Events', description: 'Événements' },
    { path: '/tools', label: 'Tools', description: 'Outils' },
    { path: '/collabs', label: 'Collabs', description: 'Collaborations' },
    { path: '/resources', label: 'Resources', description: 'Ressources' },
  ],
  auth: [
    { path: '/auth/signin', label: 'Sign In', description: 'Connexion' },
    { path: '/auth/signup', label: 'Sign Up', description: 'Inscription' },
  ],
  profile: [
    { path: '/profile', label: 'Profile', description: 'Mon profil (à créer)' },
    { path: '/profile/settings', label: 'Settings', description: 'Paramètres (à créer)' },
  ],
  legal: [
    { path: '/legal/privacy', label: 'Privacy Policy', description: 'Politique de confidentialité (à créer)' },
    { path: '/legal/terms', label: 'Terms of Service', description: 'CGU (à créer)' },
    { path: '/contact', label: 'Contact', description: 'Contact (à créer)' },
  ],
  dev: [
    { path: '/dev/sitemap', label: 'Sitemap', description: 'Arborescence du site (cette page)' },
  ],
};

export default function SitemapPage() {
    // Rediriger en production
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  const allRoutes = Object.values(ROUTES).flat();
  const totalRoutes = allRoutes.length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileTree className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Arborescence du Site</h1>
          </div>
          <p className="text-muted-foreground">
            Liste exhaustive de toutes les pages et routes de l'application.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>{totalRoutes}</strong> routes au total
          </p>
        </div>

        {/* Routes par catégorie */}
        <div className="space-y-8">
          {Object.entries(ROUTES).map(([category, routes]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize font-headline">
                  <Folder className="w-5 h-5 text-primary" />
                  {category} ({routes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {routes.map((route) => (
                    <Link
                      key={route.path}
                      href={route.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-sm font-medium group-hover:text-primary transition-colors">
                            {route.path}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {route.description}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Routes dynamiques (exemples) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Folder className="w-5 h-5 text-primary" />
              Routes Dynamiques (exemples)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="font-mono text-sm">
                  /[...slug]
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exemple: <code className="px-1 py-0.5 bg-background rounded text-primary">/projects</code> ou <code className="px-1 py-0.5 bg-background rounded text-primary">/design/projects</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>
            💡 <strong>Note:</strong> Cette page est un outil de développement. Les routes sont définies statiquement pour le moment.
          </p>
        </div>
      </div>
    </div>
  );
}
