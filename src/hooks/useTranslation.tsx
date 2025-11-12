import { usePreferences } from '@/contexts/PreferencesContext';
import { translate, TranslationKey, Language } from '@/lib/translations';

export function useTranslation() {
  const { language } = usePreferences();

  const t = (key: TranslationKey) => {
    return translate(key, language as Language);
  };

  return { t, language };
}
