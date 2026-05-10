"use client";

import { useEffect } from "react";

interface LanguageProviderProps {
  lang: string;
  children: React.ReactNode;
}

export function LanguageProvider({ lang, children }: LanguageProviderProps) {
  useEffect(() => {
    // Set the lang attribute on the html element
    document.documentElement.lang = lang;
  }, [lang]);

  return <>{children}</>;
} 