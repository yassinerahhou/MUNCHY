'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  productId?: string;
  selections?: Array<{ key: string; option: string; quantity?: number }>;
  kitchenNotes?: string;
  spice?: 'mild' | 'house' | 'hot';
  name: string;
  price: number;
  quantity: number;
  image?: string;
  customization?: Array<{ key: string; option: string }>;
};

type CartState = {
  items: CartItem[];
  points: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, change: number) => void;
  earnPoints: (amount: number) => void;
  redeemPoints: (amount: number) => void;
  clear: () => void;
  lastOrder: CartItem[];
  remember: () => void;
  replace: (items: CartItem[]) => void;
  groupToken: string | null;
  groupSync: string;
};

export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  points: 0,
  lastOrder: [],
  groupToken: null,
  groupSync: '',
  remember: () => set(state => ({ lastOrder: state.items.map(item => ({ ...item })) })),
  replace: (items) => set({ items }),
  addItem: (item) => set((state) => ({
    items: state.items.some((entry) => entry.id === item.id && !item.id.startsWith('custom-box-'))
      ? state.items.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.min(10, entry.quantity + 1) } : entry)
      : [...state.items, { ...item, quantity: 1 }]
  })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  changeQuantity: (id, change) => set((state) => ({
    items: state.items.flatMap((item) => item.id !== id ? [item] : item.quantity + change <= 0 ? [] : [{ ...item, quantity: Math.min(10, item.quantity + change) }])
  })),
  earnPoints: (amount) => set((state) => ({ points: state.points + Math.floor(amount) })),
  redeemPoints: (amount) => set((state) => ({ points: Math.max(0, state.points - Math.floor(amount)) })),
  clear: () => set({ items: [] }),
}), { name: 'munchy-cart' }));
