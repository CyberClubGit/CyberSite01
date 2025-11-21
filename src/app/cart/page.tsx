
'use client';

import { CartView } from "@/components/cart-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CartPage() {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Mon Panier</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="h-[60vh] flex flex-col">
                 <CartView />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
