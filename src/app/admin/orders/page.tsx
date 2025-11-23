
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Inbox } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { type CartItem } from '@/hooks/useCart';

interface Order {
  id: string; // The ID of the order document itself
  userId: string; // The UID of the user who made the order
  userEmail: string;
  userName: string;
  items: CartItem[];
  totalPrice: number; // in cents
  createdAt: Timestamp;
  status: 'pending' | 'processed' | 'shipped' | 'cancelled';
}

const OrderStatusBadge = ({ status }: { status: Order['status'] }) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300',
    processed: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300',
    shipped: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300',
  };
  return <Badge className={statusStyles[status]}>{status}</Badge>;
};

const StatusSelector = ({ order }: { order: Order }) => {
    const db = useFirestore();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: Order['status']) => {
        if (!order.id) {
            console.error("Order ID is missing, cannot update status.");
            return;
        }
        setIsUpdating(true);
        // **CHANGEMENT MAJEUR**: Le chemin pointe vers la collection 'orders' à la racine.
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: newStatus });
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select onValueChange={handleStatusChange} defaultValue={order.status} disabled={isUpdating}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
    );
};


export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const db = useFirestore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.isAdmin) {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.isAdmin && db) {
      // **CHANGEMENT MAJEUR**: On écoute la collection 'orders' à la racine.
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
          // L'ID utilisateur est maintenant un champ dans le document.
          ordersData.push({ 
            id: doc.id,
            ...(doc.data() as Omit<Order, 'id'>)
          });
        });
        setOrders(ordersData);
        setDataLoading(false);
      }, (error) => {
        console.error("Error fetching orders:", error);
        setDataLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, db]);

  if (authLoading || (user && !user.isAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (dataLoading) {
     return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Package /> Gestion des Commandes
          </CardTitle>
          <CardDescription>
            Affichez et gérez toutes les commandes passées par les membres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
             <div className="text-center py-16 text-muted-foreground">
                <Inbox className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">Aucune commande pour le moment.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.createdAt ? (
                      <span title={order.createdAt.toDate().toLocaleString()}>
                        {formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true, locale: fr })}
                      </span>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.userName}</div>
                    <div className="text-sm text-muted-foreground">{order.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <ul className="text-sm">
                        {order.items.map(item => (
                            <li key={item.id}>
                                {item.quantity} x {item.name}
                            </li>
                        ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(order.totalPrice / 100)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusSelector order={order} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
