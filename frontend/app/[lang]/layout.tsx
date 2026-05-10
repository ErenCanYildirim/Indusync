import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { LanguageProvider } from "@/components/LanguageProvider";

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const resolvedParams = await params;
  const messages = await getMessages();

  // Clone children and pass lang as a prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { locale: resolvedParams.lang } as any);
    }
    return child;
  });

  return (
    <NextIntlClientProvider messages={messages} locale={resolvedParams.lang}>
      <LanguageProvider lang={resolvedParams.lang}>
        <div>{childrenWithProps}</div>
      </LanguageProvider>
    </NextIntlClientProvider>
  );
}
