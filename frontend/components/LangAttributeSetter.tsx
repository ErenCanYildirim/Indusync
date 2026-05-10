"use client";

import { useEffect } from "react";

interface LangAttributeSetterProps {
  locale: string;
}

export function LangAttributeSetter({ locale }: LangAttributeSetterProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
