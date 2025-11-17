import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Sheet, Github, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserProfile } from '@/components/user-profile';


export const metadata: Metadata = {
  title: 'SheetSurfer',
  description: 'Give Your Google Sheets a New Skin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400..700&family=Orbitron:wght@400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <div className="flex flex-col min-h-screen bg-background">
            <header className="px-4 lg:px-6 h-16 flex items-center border-b">
              <Link href="/" className="flex items-center gap-2">
                <Sheet className="h-6 w-6" />
                <h1 className="text-2xl font-headline font-bold tracking-tighter">SheetSurfer</h1>
              </Link>
              <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                <Link href="/pricing">
                  <Button variant="ghost" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Pricing</span>
                  </Button>
                </Link>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </Button>
                <UserProfile />
              </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
              <p className="text-xs text-muted-foreground">&copy; 2024 SheetSurfer. All rights reserved.</p>
              <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                <a href="#" className="text-xs hover:underline underline-offset-4">Terms of Service</a>
                <a href="#" className="text-xs hover:underline underline-offset-4">Privacy</a>
              </nav>
            </footer>
          </div>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
