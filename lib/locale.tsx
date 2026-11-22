'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SiteContent, LocaleData } from '@/lib/content-types';
import { en } from '@/locales/en';
import { fr } from '@/locales/fr';
import { ar } from '@/locales/ar';

export type Locale = 'en' | 'fr' | 'ar';

export const locales: Record<Locale, LocaleData> = {
  en: en as unknown as LocaleData,
  fr,
  ar,
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function applyLocaleToContent(base: SiteContent, locale: Locale): SiteContent {
  if (locale === 'en') return base;
  const target = locales[locale] || locales.en;

  return {
    ...base,
    products: base.products.map(product => ({ ...product, description: base.menuCopy?.[locale]?.[product.id] || product.description })),
    announcement: target.announcement,
    nav: target.nav,
    hero: {
      ...base.hero,
      eyebrow: target.hero.eyebrow,
      title: [...target.hero.title],
      body: target.hero.body,
      primary: target.hero.primary,
      secondary: target.hero.secondary,
      open: target.hero.open,
      delivery: target.hero.delivery,
      stamp: target.hero.stamp,
    },
    menu: { ...base.menu, label: target.menu.label, title: target.menu.title, body: target.menu.body },
    catalog: { ...base.catalog, ...target.catalog, title: [...target.catalog.title] },
    matcher: { ...base.matcher, ...target.matcher, budgets: [...target.matcher.budgets], hunger: [...target.matcher.hunger] },
    builder: { ...base.builder, ...target.builder },
    cart: { ...base.cart, ...target.cart },
    checkout: { ...base.checkout, ...target.checkout },
    fulfillment: { ...base.fulfillment, ...target.fulfillment },
    club: { ...base.club, ...target.club },
    footer: { ...base.footer, ...target.footer },
    contact: {
      ...base.contact,
    },
    story: {
      ...base.story,
      ...target.story,
      title: [...target.story.title],
      paragraphs: [...target.story.paragraphs],
      values: [...target.story.values],
    },
    catering: {
      ...base.catering,
      ...target.catering,
      title: [...target.catering.title],
      packages: [...target.catering.packages],
      eventTypes: [...target.catering.eventTypes],
    },
    tracking: {
      ...base.tracking,
      ...target.tracking,
      title: [...target.tracking.title],
      statuses: target.tracking.statuses,
    },
    admin: { ...base.admin, ...target.admin, filters: target.admin.filters },
    ui: {
      ...base.ui,
      ...target.ui,
      servicePoints: [...target.ui.servicePoints],
      changeOptions: [...target.ui.changeOptions],
      comboTitle: [...target.ui.comboTitle],
      comboSticker: [...target.ui.comboSticker],
      comboBenefits: [...target.ui.comboBenefits],
      clubSticker: [...target.ui.clubSticker],
      receiptTitle: [...target.ui.receiptTitle],
    },
  };
}

// Canonical names remain stable for filtering and CMS changes; translate labels only.
export function categoryLabel(category: string, locale: Locale) {
  const index = (en.menu.categories as readonly string[]).indexOf(category);
  return index < 0 ? category : locales[locale].menu.categories[index] || category;
}

export function LocaleProvider({ children, initialLocale = 'en' }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('munchy_locale') as Locale | null;
      if (saved && (saved === 'en' || saved === 'fr' || saved === 'ar')) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      }
    } catch {
      // localStorage may be disabled
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('munchy_locale', newLocale);
      document.cookie = `munchy_locale=${newLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
