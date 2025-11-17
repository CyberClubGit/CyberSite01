"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, Github, ExternalLink, User as UserIcon, LogOut, CreditCard } from "lucide-react";
import { useUser } from "@/firebase";
import { AuthComponent } from "@/components/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAuth } from "firebase/auth";
import Link from "next/link";

// Mock data to simulate fetched Google Sheet content
const mockData = [
  { id: 'PROD-001', name: 'Quantum Laptop', category: 'Electronics', stock: 42, price: '$1200.00' },
  { id: 'PROD-002', name: 'Gravity-Defying Boots', category: 'Apparel', stock: 150, price: '$250.50' },
  { id: 'PROD-003', name: 'Sentient Coffee Mug', category: 'Home Goods', stock: 3, price: '$45.00' },
  { id: 'PROD-004', name: 'Chrono-Watch', category: 'Accessories', stock: 78, price: '$399.99' },
  { id: 'PROD-005', name: 'Data-Crystal Necklace', category: 'Jewelry', stock: 25, price: '$750.00' },
];

function UserProfile() {
  const { user, loading } = useUser();
  const auth = getAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <AuthComponent />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
            <AvatarFallback>
              {user.displayName?.charAt(0) ?? user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => auth.signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function Home() {
  return (
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

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Give Your Google Sheets a New Skin
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  SheetSurfer transforms your public Google Sheets into beautiful, interactive web pages. No code, just a URL.
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg">Get Started <ExternalLink className="ml-2 h-4 w-4" /></Button>
                <Button variant="secondary" size="lg">Learn More</Button>
              </div>
            </div>
          </div>
        </section>

        <section id="preview" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
               <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Data Preview</h2>
               <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">This is how your Google Sheet data could look.</p>
            </div>
            <Card className="mx-auto max-w-5xl shadow-2xl">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-headline font-bold">Product ID</TableHead>
                      <TableHead className="font-headline font-bold">Name</TableHead>
                      <TableHead className="font-headline font-bold">Category</TableHead>
                      <TableHead className="font-headline font-bold text-right">Stock</TableHead>
                      <TableHead className="font-headline font-bold text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">{item.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SheetSurfer. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a href="#" className="text-xs hover:underline underline-offset-4">Terms of Service</a>
          <a href="#" className="text-xs hover:underline underline-offset-4">Privacy</a>
        </nav>
      </footer>
    </div>
  );
}
