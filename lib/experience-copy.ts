import { useLocale } from '@/lib/locale';
import { useSiteContent } from '@/components/content-provider';
import { experienceCopy } from '@/locales/experience';
export { experienceCopy } from '@/locales/experience';
export function useExperienceCopy() {
  const { locale } = useLocale();
  const content = useSiteContent();
  return { ...experienceCopy[locale], ...content.editorial?.[locale] };
}
