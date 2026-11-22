'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { initialContent, type SiteContent } from '@/lib/content-types';
import { refreshCart } from '@/lib/cart-share';
import { useCart } from '@/lib/cart';
import { LocaleProvider, useLocale, applyLocaleToContent, type Locale } from '@/lib/locale';

const ContentContext = createContext<SiteContent>(initialContent);

function InnerContentProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  const { locale } = useLocale();
  const localizedContent = useMemo(() => applyLocaleToContent(content, locale), [content, locale]);

  useEffect(() => {
    const current = useCart.getState().items;
    const items = refreshCart(current, content);
    if (JSON.stringify(items) !== JSON.stringify(current)) useCart.setState({ items });
  }, [content.products, content.mealOptions, content.builderOptions]);

  return <ContentContext.Provider value={localizedContent}>{children}</ContentContext.Provider>;
}

export function ContentProvider({ content, children, initialLocale = 'en' }: { content: SiteContent; children: React.ReactNode; initialLocale?: Locale }) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <InnerContentProvider content={content}>{children}</InnerContentProvider>
    </LocaleProvider>
  );
}

export function useSiteContent() {
  return useContext(ContentContext);
}
