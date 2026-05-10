"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "@/hooks/use-form";
import { useAuth } from "@/lib/hooks/useAuth";
import { patterns } from "@/lib/validation";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicOnly } from "@/components/RouteProtection";
import { useTranslations, useLocale } from "next-intl";
import { paths } from "@/lib/navigation";

interface ForgotPasswordPageProps {
  locale: string;
}

export default function ForgotPasswordPage({
  locale,
}: ForgotPasswordPageProps) {
  const { requestPasswordReset, isRequestingPasswordReset } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const t = useTranslations("ForgotPassword");
  const currentLocale = useLocale();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      email: "",
    },
    validationRules: {
      email: {
        required: true,
        pattern: patterns.email,
      },
    },
    onSubmit: async (formValues) => {
      try {
        await requestPasswordReset(formValues.email);
        setIsSuccess(true);
      } catch (error) {
        // Error handling is done in the useAuth hook via toast
        console.error("Password reset request failed:", error);
      }
    },
  });

  if (isSuccess) {
    return (
      <PublicOnly>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold text-foreground">
                Indusync
              </h1>
            </div>
            <Card className="border-border shadow-lg bg-card">
              <CardHeader className="space-y-1 pt-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-center text-foreground font-medium">
                  {t("emailSentTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    {t("emailSentDescription")} <strong>{values.email}</strong>{" "}
                    {t("checkInbox")}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
                <Button asChild className="w-full">
                  <Link href={paths.login(currentLocale as "de" | "en")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("backToLogin")}
                  </Link>
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {t("emailNotReceived")}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSuccess(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("resend")}
                  </button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </PublicOnly>
    );
  }

  return (
    <PublicOnly>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-foreground">Indusync</h1>
          </div>
          <Card className="border-border shadow-lg bg-card">
            <CardHeader className="space-y-1 pt-6">
              <CardTitle className="text-2xl text-center text-foreground font-medium">
                {t("title")}
              </CardTitle>
              <p className="text-center text-muted-foreground text-sm">
                {t("description")}
              </p>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {submitError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="font-normal text-muted-foreground"
                  >
                    {t("emailLabel")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${
                      errors.email && touched.email
                        ? "border-destructive"
                        : "border-input"
                    } bg-background text-foreground h-10`}
                  />
                  {errors.email && touched.email && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10"
                  type="submit"
                  disabled={isSubmitting || isRequestingPasswordReset}
                >
                  {isSubmitting || isRequestingPasswordReset
                    ? t("sending")
                    : t("resetButton")}
                </Button>
                <div className="text-center">
                  <Link
                    href={paths.login(currentLocale as "de" | "en")}
                    className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    {t("backToLogin")}
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
          <div className="mt-10 text-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Indusync GmbH.{" "}
              {t("allRightsReserved")}
            </p>
            <div className="mt-3 flex justify-center space-x-4">
              <Link
                href={paths.privacy(currentLocale as "de" | "en")}
                className="hover:text-primary hover:underline"
              >
                {t("privacy")}
              </Link>
              <Link
                href={paths.terms(currentLocale as "de" | "en")}
                className="hover:text-primary hover:underline"
              >
                {t("terms")}
              </Link>
              <Link
                href="/impressum"
                className="hover:text-primary hover:underline"
              >
                {t("imprint")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicOnly>
  );
}
