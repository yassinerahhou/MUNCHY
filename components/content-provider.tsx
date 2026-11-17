'use client';
import { createContext, useContext, useEffect } from 'react';
import { initialContent, type SiteContent } from '@/lib/content-types';
import { configuredProduct } from '@/lib/product-options';
import { useCart } from '@/lib/cart';
const ContentContext = createContext<SiteContent>(initialContent);
export function ContentProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  useEffect(() => {
    const current = useCart.getState().items;
    const items = current.flatMap((item) => {
      if (item.id.startsWith('custom-box-')) return [item];
      const product = content.products.find((entry) => entry.id === (item.productId || item.id) && entry.available !== false);
      if (!product) return [];
      const configured = configuredProduct(product, item.selections || [], content);
      return configured ? [{ ...item, ...configured }] : [];
    });
    if (JSON.stringify(items) !== JSON.stringify(current)) useCart.setState({ items });
  }, [content.products, content.mealOptions]);
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
export function useSiteContent() { return useContext(ContentContext); }
