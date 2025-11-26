
'use client';

import { type Brand, type Category, type NetworkMember } from '@/lib/sheets';
import { VideoBackground } from './video-background';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';

interface HomePageClientProps {
  category: Category;
  brand?: Brand;
  network: NetworkMember[];
}

export function HomePageClient({ category, brand, network }: HomePageClientProps) {
  const brandName = brand?.Brand || 'CYBER CLUB';

  const samuel = network.find(m => m.Name === 'Samuel Belaisch');
  const otherMembers = network.filter(m => m.Name !== 'Samuel Belaisch');

  return (
    <>
      {/* Section 1: Hero with Video Background */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center p-4">
        {category.Background && <VideoBackground src={category.Background} />}
        <div className="relative z-10 bg-background/20 backdrop-blur-sm p-8 rounded-lg">
          <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
            <span className="block text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground tracking-widest">Welcome to</span>
            <span className="capitalize">{brandName}</span>
          </h1>
        </div>
      </div>

      {/* Section 2: Network */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background border-y">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Network</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Notre écosystème de créateurs, chercheurs et collaborateurs.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            {/* Left side: Samuel Belaisch */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              {samuel && (
                <Card className="w-full max-w-sm bg-muted/30">
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                        {samuel.profilePictureUrl && (
                             <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary">
                                <Image
                                    src={samuel.profilePictureUrl}
                                    alt={samuel.Name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className='text-center'>
                            <h3 className="text-2xl font-headline font-bold">{samuel.Name}</h3>
                            <p className="text-primary font-semibold">{samuel.Role}</p>
                            <p className="text-sm text-muted-foreground mt-2">{samuel.Bio}</p>
                        </div>
                    </CardContent>
                </Card>
              )}
            </div>
            
            {/* Right side: Network List */}
            <div>
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Collaborateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {otherMembers.map(member => (
                            <li key={member.Name} className="flex items-center gap-4">
                                <Avatar>
                                    {member.profilePictureUrl && <AvatarImage src={member.profilePictureUrl} alt={member.Name} />}
                                    <AvatarFallback>{member.Name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{member.Name}</p>
                                    <p className="text-sm text-muted-foreground">{member.Role}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Blank Content Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Contenu à venir</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Cette section est prête à accueillir de nouveaux modules, composants ou informations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
