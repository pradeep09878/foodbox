import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: number;
  item_id: number;
  vendor_id: number;
  quantity: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  is_available: boolean;
  is_veg: boolean;
  vendor_name: string;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  total: number;
  vendorId: number | null;
  addItem: (item_id: number, quantity: number) => Promise<void>;
  removeItem: (item_id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { authType } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const vendorId = useMemo(() => (items.length > 0 ? items[0].vendor_id : null), [items]);

  useEffect(() => {
    if (authType === 'user') {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [authType]);

  async function fetchCart() {
    if (authType !== 'user') return;
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function addItem(item_id: number, quantity: number) {
    await api.post('/cart/add', { item_id, quantity });
    await fetchCart();
  }

  async function removeItem(item_id: number) {
    if (quantity_for(item_id) > 1) {
      await api.post('/cart/add', { item_id, quantity: quantity_for(item_id) - 1 });
    } else {
      await api.delete(`/cart/item/${item_id}`);
    }
    await fetchCart();
  }

  function quantity_for(item_id: number): number {
    return items.find(i => i.item_id === item_id)?.quantity ?? 0;
  }

  async function clearCart() {
    await api.delete('/cart');
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, loading, total, vendorId, addItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
