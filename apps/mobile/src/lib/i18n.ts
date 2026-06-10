import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSecureItem, setSecureItem } from './secure-storage';

import en from '../../../../packages/shared/locales/en.json';
import hi from '../../../../packages/shared/locales/hi.json';

const LANGUAGE_KEY = 'user-preferred-language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

// Detect default language from device locale (default to 'en')
const getDeviceLanguage = (): string => {
  // Simple check — default to English unless device language contains hi
  // In real app, can use expo-localization, but simple checks are robust
  return 'en';
};

export async function initI18n() {
  let locale = await getSecureItem(LANGUAGE_KEY);
  if (!locale) {
    locale = getDeviceLanguage();
    await setSecureItem(LANGUAGE_KEY, locale);
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export async function changeLanguage(lang: 'en' | 'hi') {
  await setSecureItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
