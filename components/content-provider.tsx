'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { initialContent, type SiteContent } from '@/lib/content-types';
import { configuredProduct } from '@/lib/product-options';
import { useCart } from '@/lib/cart';
import { LocaleProvider, useLocale, applyLocaleToContent } from '@/lib/locale';

const ContentContext = createContext<SiteContent>(initialContent);

function InnerContentProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  const { locale } = useLocale();
  const localizedContent = useMemo(() => applyLocaleToContent(content, locale), [content, locale]);

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

  return <ContentContext.Provider value={localizedContent}>{children}</ContentContext.Provider>;
}

export function ContentProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <InnerContentProvider content={content}>{children}</InnerContentProvider>
    </LocaleProvider>
  );
}

export function useSiteContent() {
  return useContext(ContentContext);
}
