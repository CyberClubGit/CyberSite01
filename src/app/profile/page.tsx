
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Mail, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container py-12">
        <Card className="w-full max-w-2xl mx-auto">
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
    );
  }

  return (
    <div className="container py-12">
      <Card className="w-full max-w-2xl mx-auto bg-background/80 backdrop-blur-sm">
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
            <Button variant="destructive" onClick={signOut}>Déconnexion</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
