import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type AppLanguage = 'en' | 'ur';

const LANG_STORAGE_KEY = 'usman_mobile_lang_v1';

interface LanguageContextValue {
  lang: AppLanguage;
  isUrdu: boolean;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  t: (en: string, ur: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  isUrdu: false,
  setLang: () => {},
  toggleLang: () => {},
  t: (en) => en,
});

function loadInitialLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'ur' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore storage issues
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => loadInitialLanguage());

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage issues
    }
    document.documentElement.lang = lang === 'ur' ? 'ur' : 'en';
  }, [lang]);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'ur' : 'en'));
  }, []);

  const t = useCallback(
    (en: string, ur: string) => (lang === 'ur' ? ur : en),
    [lang],
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        isUrdu: lang === 'ur',
        setLang,
        toggleLang,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
