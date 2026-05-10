"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { paths } from "@/lib/navigation";

interface UnauthorizedPageProps {
  locale: string;
}

export default function UnauthorizedPage({ locale }: UnauthorizedPageProps) {
  const t = useTranslations("Unauthorized");
  const currentLocale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>{t("details")}</p>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => window.history.back()}
              variant="default"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backButton")}
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href={paths.dashboard(currentLocale as "de" | "en")}>
                <Home className="h-4 w-4 mr-2" />
                {t("dashboardButton")}
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <Link href={paths.login(currentLocale as "de" | "en")}>
                {t("loginButton")}
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4">
            <p>{t("supportText")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
