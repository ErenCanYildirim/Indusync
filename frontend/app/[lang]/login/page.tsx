"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicOnly } from "@/components/RouteProtection";
import { useTranslations, useLocale } from "next-intl";
import { paths } from "@/lib/navigation";

interface LoginPageProps {
  locale: string;
}

export default function LoginPage({ locale }: LoginPageProps) {
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = useTranslations("Login");
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
      password: "",
    },
    validationRules: {
      email: {
        required: true,
        pattern: patterns.email,
      },
      password: {
        required: true,
      },
    },
    onSubmit: async (formValues) => {
      login({
        email: formValues.email,
        password: formValues.password,
        rememberMe: rememberMe,
      });
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <PublicOnly>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              {/* Logo placeholder */}
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Indusync</h1>
          </div>
          <Card className="border-border shadow-lg bg-card">
            <CardHeader className="space-y-1 pt-6">
              <CardTitle className="text-2xl text-center text-foreground font-medium">
                {t("title")}
              </CardTitle>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="font-normal text-muted-foreground"
                    >
                      {t("passwordLabel")}
                    </Label>
                    <Link
                      href={paths.forgotPassword(currentLocale as "de" | "en")}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${
                        errors.password && touched.password
                          ? "border-destructive"
                          : "border-input"
                      } bg-background text-foreground h-10 pr-10`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                  >
                    {t("rememberMe")}
                  </label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10"
                  type="submit"
                  disabled={isSubmitting || isLoggingIn}
                >
                  {isSubmitting || isLoggingIn
                    ? t("loggingIn")
                    : t("loginButton")}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {t("noAccount")}{" "}
                  <Link
                    href={paths.register(currentLocale as "de" | "en")}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("register")}
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
