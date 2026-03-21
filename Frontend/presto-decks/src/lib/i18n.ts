import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
import { getInitialLocale } from '@/lib/localeRouting';

const initialLanguage = getInitialLocale(
    typeof window !== 'undefined' ? window.location.pathname : '/',
    typeof window !== 'undefined' ? window.localStorage.getItem('i18nextLng') : null
);

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: fr },
            en: { translation: en },
        },
        lng: initialLanguage,
        fallbackLng: 'fr',
        supportedLngs: ['fr', 'en'],
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        detection: {
            order: ['localStorage'],
            caches: ['localStorage'],
        },
    });

export default i18n;
