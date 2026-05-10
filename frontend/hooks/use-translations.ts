import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { translations, Language, TranslationSet } from '@/lib/i18n/translations';
import { getLangFromPath } from '@/lib/navigation';

export interface UseTranslationsReturn {
  lang: Language;
  setLang: React.Dispatch<React.SetStateAction<Language>>;
  t: TranslationSet;
  handleLanguageChange: (newLang: string) => void;
}

export function useTranslations(defaultLang: Language = 'de'): UseTranslationsReturn {
  const pathname = usePathname();
  const [lang, setLang] = useState<Language>(defaultLang);
  const langRef = useRef(lang);

  // Update ref when lang changes
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Sync with URL changes
  useEffect(() => {
    const urlLang = getLangFromPath(pathname);
    if (urlLang && urlLang !== langRef.current) {
      setLang(urlLang);
    }
  }, [pathname]);

  // Also sync with the defaultLang prop
  useEffect(() => {
    if (defaultLang && (defaultLang === 'de' || defaultLang === 'en') && defaultLang !== langRef.current) {
      setLang(defaultLang);
    }
  }, [defaultLang]);

  const handleLanguageChange = (newLang: string) => {
    setLang(newLang as Language);
  };

  // Optionally, you could persist the language preference
  // For example, using localStorage:
  // useEffect(() => {
  //   const storedLang = localStorage.getItem('preferredLang');
  //   if (storedLang && translations[storedLang as Language]) {
  //     setLang(storedLang as Language);
  //   }
  // }, []);

  // useEffect(() => {
  //   localStorage.setItem('preferredLang', lang);
  // }, [lang]);

  const t = translations[lang];

  return {
    lang,
    setLang,
    t,
    handleLanguageChange,
  };
}