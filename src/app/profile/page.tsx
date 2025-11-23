
'use client';

import { useAuth, type UserData } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Mail, User, Heart, CreditCard, Box, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import Link from 'next/link';

type View = 'profil' | 'favoris' | 'paiement' | 'espace';

const ProfileSkeleton = () => (
  <div className="container py-12">
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/4">
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="w-full md:w-3/4">
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="w-full space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ProfileView = ({ user, onSignOut }: { user: UserData; onSignOut: () => void }) => (
  <Card>
    <CardHeader className="text-center">
      <CardTitle className="text-3xl font-headline">Mon Profil</CardTitle>
      <CardDescription>Vos informations personnelles</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-center gap-8">
      <Avatar className="h-32 w-32 border-4 border-primary">
        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Avatar'} />
        <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
          {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="w-full space-y-4 text-center">
        <div className="text-2xl font-bold font-headline">{user.displayName}</div>
        {user.nickname && <div className="text-lg text-muted-foreground">@{user.nickname}</div>}
         <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
        </div>
      </div>
      
      <div className="w-full flex justify-center gap-4 mt-4">
        <Button variant="outline" onClick={() => { /* TODO: Implement edit profile */ }}>Modifier le profil</Button>
        <Button variant="destructive" onClick={onSignOut}>Déconnexion</Button>
      </div>
    </CardContent>
  </Card>
);

const FavoritesView = () => {
    const { favorites, loading: favoritesLoading } = useFavorites();

    if (favoritesLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Mes Favoris</CardTitle>
                    <CardDescription>Les articles que vous avez sauvegardés.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Mes Favoris</CardTitle>
                <CardDescription>
                    {favorites.length > 0 ? `Vous avez ${favorites.length} article(s) sauvegardé(s).` : "Vous n'avez pas encore de favoris."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map(fav => (
                            <div key={fav} className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <span className="font-medium">{fav}</span>
                                {/* TODO: Link to item page */}
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href="/catalog">
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Heart className="mx-auto h-12 w-12 mb-4" />
                        <p>Parcourez le catalogue et cliquez sur le cœur pour ajouter des articles ici.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const ComingSoonView = ({ title, description }: { title: string; description: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-headline">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-16 text-muted-foreground">
                <Box className="mx-auto h-12 w-12 mb-4" />
                <p>Cette fonctionnalité sera bientôt disponible.</p>
            </div>
        </CardContent>
    </Card>
);


export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>('profil');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  const menuItems = [
    { id: 'profil' as View, label: 'Profil', icon: User },
    { id: 'favoris' as View, label: 'Favoris', icon: Heart },
    { id: 'paiement' as View, label: 'Moyen de paiement', icon: CreditCard },
    { id: 'espace' as View, label: 'Espace personnel', icon: Box },
  ];

  return (
    <div className="container py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Left Menu */}
            <nav className="w-full md:w-1/4 lg:w-1/5">
                <div className="sticky top-24 space-y-2">
                    {menuItems.map(item => (
                         <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-left h-12 px-4 text-base",
                                activeView === item.id ? "bg-muted font-semibold" : ""
                            )}
                            onClick={() => setActiveView(item.id)}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </Button>
                    ))}
                </div>
            </nav>

            {/* Right Content */}
            <main className="w-full md:w-3/4 lg:w-4/5">
                {activeView === 'profil' && <ProfileView user={user} onSignOut={signOut} />}
                {activeView === 'favoris' && <FavoritesView />}
                {activeView === 'paiement' && (
                    <ComingSoonView 
                        title="Moyen de paiement"
                        description="Gérez vos cartes et informations de facturation."
                    />
                )}
                {activeView === 'espace' && (
                    <ComingSoonView
                        title="Espace Personnel"
                        description="Accédez à vos contenus et créations."
                    />
                )}
            </main>
        </div>
    </div>
  );
}

    

    