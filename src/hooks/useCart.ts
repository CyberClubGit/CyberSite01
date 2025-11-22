
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { toast } from './use-toast';

export interface CartItem {
  id: string; // This ID MUST be the unique ID from the Google Sheet
  name: string;
  price: number; // Price in cents
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number; // in cents
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cyber-club-cart-v2';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCartJson = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCartJson) {
        const savedCart = JSON.parse(savedCartJson);
        // Basic validation to ensure we're loading an array of items
        if (Array.isArray(savedCart)) {
          // Additional validation for each item
          const validatedCart = savedCart.filter(item => 
              item.id && 
              typeof item.id === 'string' &&
              item.name &&
              typeof item.price === 'number' &&
              typeof item.quantity === 'number'
          );
          setCart(validatedCart);
        }
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      setCart([]);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cart]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    // Critical validation: Do not add items without valid data.
    if (!item.id || typeof item.id !== 'string' || typeof item.price !== 'number' || item.price <= 0) {
        console.error("Attempted to add an item with invalid data:", item);
        toast({
            variant: "destructive",
            title: "Erreur d'ajout",
            description: "Cet article ne peut pas être ajouté au panier (données invalides).",
        });
        return;
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex > -1) {
        // If item exists, create a new array with the updated item
        const newCart = [...prevCart];
        const existingItem = newCart[existingItemIndex];
        newCart[existingItemIndex] = { 
            ...existingItem, 
            quantity: existingItem.quantity + (item.quantity || 1) 
        };
        return newCart;
      } else {
        // If item does not exist, add it as a new item to the cart
        return [...prevCart, { ...item, quantity: item.quantity || 1 }];
      }
    });

    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier.`,
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        // If quantity is 0 or less, remove the item
        return prevCart.filter(item => item.id !== id);
      }
      // Otherwise, update the quantity
      return prevCart.map(item => (item.id === id ? { ...item, quantity } : item));
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
