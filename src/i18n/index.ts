import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only the fallback language is bundled eagerly. The other 9 locales are
// code-split into their own chunks and loaded on demand — the active language
// is preloaded before first paint (no flash of English), the rest load the
// first time they're switched to. This keeps ~9 locale JSONs out of the
// critical cold-start bundle (notably faster on the Capacitor WebView).
import en from './locales/en.json';

export const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

const SUPPORTED = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'pl', 'tr', 'ar'] as const;

// Lazy loaders — each becomes its own async chunk via dynamic import().
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  de: () => import('./locales/de.json'),
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
  it: () => import('./locales/it.json'),
  nl: () => import('./locales/nl.json'),
  pt: () => import('./locales/pt.json'),
  pl: () => import('./locales/pl.json'),
  tr: () => import('./locales/tr.json'),
  ar: () => import('./locales/ar.json'),
};

function normalize(lng?: string | null): string {
  if (!lng) return 'en';
  const base = lng.split('-')[0].toLowerCase();
  return (SUPPORTED as readonly string[]).includes(base) ? base : 'en';
}

// Mirror i18next-browser-languagedetector's order (localStorage → navigator)
// so we can preload the right locale before init.
function detectInitial(): string {
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) return normalize(stored);
  } catch {
    /* localStorage unavailable */
  }
  if (typeof navigator !== 'undefined') return normalize(navigator.language);
  return 'en';
}

async function loadLocale(code: string): Promise<void> {
  if (code === 'en' || i18n.hasResourceBundle(code, 'translation')) return;
  const loader = loaders[code];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(code, 'translation', mod.default, true, true);
}

const initialLng = detectInitial();

export const i18nInitPromise = (async () => {
  const resources: Record<string, { translation: Record<string, unknown> }> = {
    en: { translation: en as Record<string, unknown> },
  };
  // Preload the active language BEFORE init so there's no English flash.
  if (initialLng !== 'en') {
    try {
      const mod = await loaders[initialLng]();
      resources[initialLng] = { translation: mod.default as Record<string, unknown> };
    } catch {
      /* fall back to en if the chunk fails to load */
    }
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLng,
      supportedLngs: [...SUPPORTED],
      fallbackLng: 'en',
      load: 'languageOnly',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      react: {
        useSuspense: true,
      },
    });

  // Lazy-load any other language the first time it's switched to. react-i18next
  // re-renders on the 'added' store event once the bundle arrives.
  i18n.on('languageChanged', (lng) => {
    void loadLocale(normalize(lng));
  });
})();

export default i18n;
