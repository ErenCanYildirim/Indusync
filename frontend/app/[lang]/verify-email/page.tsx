"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Terminal } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { paths } from "@/lib/navigation";

interface VerifyEmailContentProps {
  locale: string;
}

function VerifyEmailContent({ locale }: VerifyEmailContentProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("VerifyEmail");
  const currentLocale = useLocale();

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailInput, setEmailInput] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Automatically verify email if the token query param is present
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setVerifying(true);
      setError(null);
      setSuccess(null);

      try {
        await authApi.verifyEmail(token);
        setSuccess(t("emailVerified"));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : t("verificationFailed");
        setError(message);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, t]);

  // Resend verification email
  const handleResendVerification = async () => {
    const emailToUse = user?.email || emailInput.trim();

    if (!emailToUse) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.resendEmailVerification(emailToUse);
      setSuccess(
        "Eine neue Bestätigungs-E-Mail wurde gesendet. Bitte überprüfen Sie Ihren Posteingang."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Das erneute Senden der Bestätigungsmail ist fehlgeschlagen.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler (only shown when the user is already logged in)
  const handleLogout = async () => {
    await logout();
    router.push(paths.login(currentLocale as "de" | "en"));
  };

  // Helper to render alert messages
  const renderAlerts = () => (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert
          variant="default"
          className="mb-4 bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600"
        >
          <Terminal className="h-4 w-4" />
          <AlertTitle>{t("success")}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {token ? t("verifyingTitle") : t("title")}
          </CardTitle>
          <CardDescription>
            {token
              ? t("verifyingDescription")
              : t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderAlerts()}

          {/* Verification flow when token is present */}
          {token && (
            <div className="space-y-4">
              {verifying && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("verifyingText")}</span>
                </div>
              )}

              {!verifying && success && (
                <Button onClick={() => router.push(paths.login(currentLocale as "de" | "en"))}>
                  {t("loginButton")}
                </Button>
              )}

              {!verifying && error && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("resendDescription")}
                  </p>
                  <div className="flex flex-col space-y-4">
                    {!user && (
                      <Input
                        placeholder={t("emailPlaceholder")}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        type="email"
                        required
                      />
                    )}
                    <Button
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>{t("resendButton")}</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Default resend flow when no token is present */}
          {!token && (
            <div className="space-y-4">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                {t("emailSent")} <strong>{user?.email}</strong>{" "}
                {t("emailNotReceived")}
              </p>

              {!user && (
                <Input
                  placeholder={t("emailPlaceholder")}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  type="email"
                  required
                />
              )}

              <div className="flex flex-col space-y-4">
                <Button
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Mail className="h-4 w-4" />
                  <span>{t("resendConfirmation")}</span>
                </Button>
                {user && (
                  <Button onClick={handleLogout} variant="outline">
                    {t("logoutButton")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  const t = useTranslations("VerifyEmail");
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("loading")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("loadingDescription")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface VerifyEmailPageProps {
  locale: string;
}

export default function VerifyEmailPage({ locale }: VerifyEmailPageProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent locale={locale} />
    </Suspense>
  );
}
