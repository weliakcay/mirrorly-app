import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';

export const LANGS = [
  { code: 'tr', label: 'Türkçe', short: 'TR' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ru', label: 'Русский', short: 'RU' },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: {} }, // Türkçe = anahtarın kendisi
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      ru: { translation: ru },
    },
    fallbackLng: 'tr',
    supportedLngs: ['tr', 'en', 'de', 'fr', 'ru'],
    // Türkçe metin ANAHTAR → ayraçları kapat ("Fiyat: 100" bölünmesin)
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
  });

const setHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = (lng || 'tr').split('-')[0];
};
setHtmlLang(i18n.language);
i18n.on('languageChanged', setHtmlLang);

export default i18n;
