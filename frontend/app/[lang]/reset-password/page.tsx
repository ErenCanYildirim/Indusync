"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicOnly } from "@/components/RouteProtection";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword, isResettingPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  // Get token from URL parameters
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      router.push("/login");
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams, router]);

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
      newPassword: "",
      confirmPassword: "",
    },
    validationRules: {
      newPassword: {
        required: true,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      },
      confirmPassword: {
        required: true,
      },
    },
    onSubmit: async (formValues) => {
      if (!token) {
        throw new Error("Kein Token verfügbar");
      }

      // Custom validation for password requirements
      if (passwordErrors.length > 0) {
        throw new Error("Passwort erfüllt nicht alle Anforderungen");
      }

      // Custom validation for password confirmation
      if (formValues.newPassword !== formValues.confirmPassword) {
        throw new Error("Passwörter stimmen nicht überein");
      }

      await resetPassword({
        token,
        newPassword: formValues.newPassword,
        confirmPassword: formValues.confirmPassword,
      });
    },
  });

  // Custom password validation
  useEffect(() => {
    const errors: string[] = [];
    if (values.newPassword) {
      if (values.newPassword.length < 8) {
        errors.push("Mindestens 8 Zeichen");
      }
      if (!/(?=.*[a-z])/.test(values.newPassword)) {
        errors.push("Mindestens ein Kleinbuchstabe");
      }
      if (!/(?=.*[A-Z])/.test(values.newPassword)) {
        errors.push("Mindestens ein Großbuchstabe");
      }
      if (!/(?=.*\d)/.test(values.newPassword)) {
        errors.push("Mindestens eine Zahl");
      }
    }
    setPasswordErrors(errors);
  }, [values.newPassword]);

  // Custom confirm password validation
  useEffect(() => {
    if (
      values.confirmPassword &&
      values.newPassword !== values.confirmPassword
    ) {
      setConfirmPasswordError("Passwörter stimmen nicht überein");
    } else {
      setConfirmPasswordError("");
    }
  }, [values.newPassword, values.confirmPassword]);

  if (!token) {
    return (
      <PublicOnly>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <Card className="border-border shadow-lg bg-card">
              <CardHeader className="space-y-1 pt-6">
                <CardTitle className="text-2xl text-center text-foreground font-medium">
                  Ungültiger Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie
                    einen neuen Link an.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
                <Button asChild className="w-full">
                  <Link href="/passwort-vergessen">Neuen Link anfordern</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Anmeldung
                  </Link>
                </Button>
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
                Neues Passwort erstellen
              </CardTitle>
              <p className="text-center text-muted-foreground text-sm">
                Geben Sie Ihr neues Passwort ein. Stellen Sie sicher, dass es
                sicher ist.
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
                    htmlFor="newPassword"
                    className="font-normal text-muted-foreground"
                  >
                    Neues Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mindestens 8 Zeichen"
                      value={values.newPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${
                        errors.newPassword && touched.newPassword
                          ? "border-destructive"
                          : "border-input"
                      } bg-background text-foreground h-10 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>{" "}
                  {(errors.newPassword && touched.newPassword) ||
                  passwordErrors.length > 0 ? (
                    <div className="text-destructive text-xs mt-1 space-y-1">
                      {errors.newPassword && <p>{errors.newPassword}</p>}
                      {passwordErrors.map((error, index) => (
                        <p key={index}>• {error}</p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="font-normal text-muted-foreground"
                  >
                    Passwort bestätigen
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Passwort wiederholen"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-destructive"
                          : "border-input"
                      } bg-background text-foreground h-10 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>{" "}
                  {((errors.confirmPassword && touched.confirmPassword) ||
                    confirmPasswordError) && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.confirmPassword || confirmPasswordError}
                    </p>
                  )}
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">
                    Ihr Passwort muss folgende Anforderungen erfüllen:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li
                      className={
                        values.newPassword.length >= 8 ? "text-green-600" : ""
                      }
                    >
                      • Mindestens 8 Zeichen
                    </li>
                    <li
                      className={
                        /(?=.*[a-z])/.test(values.newPassword)
                          ? "text-green-600"
                          : ""
                      }
                    >
                      • Mindestens ein Kleinbuchstabe
                    </li>
                    <li
                      className={
                        /(?=.*[A-Z])/.test(values.newPassword)
                          ? "text-green-600"
                          : ""
                      }
                    >
                      • Mindestens ein Großbuchstabe
                    </li>
                    <li
                      className={
                        /(?=.*\d)/.test(values.newPassword)
                          ? "text-green-600"
                          : ""
                      }
                    >
                      • Mindestens eine Zahl
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10"
                  type="submit"
                  disabled={isSubmitting || isResettingPassword}
                >
                  {isSubmitting || isResettingPassword
                    ? "Passwort wird zurückgesetzt..."
                    : "Passwort zurücksetzen"}
                </Button>
                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Zurück zur Anmeldung
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
          <div className="mt-10 text-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} IndustrieConnect GmbH. Alle Rechte
              vorbehalten.
            </p>
            <div className="mt-3 flex justify-center space-x-4">
              <Link
                href="/datenschutz"
                className="hover:text-primary hover:underline"
              >
                Datenschutz
              </Link>
              <Link href="/agb" className="hover:text-primary hover:underline">
                AGB
              </Link>
              <Link
                href="/impressum"
                className="hover:text-primary hover:underline"
              >
                Impressum
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicOnly>
  );
}

function LoadingFallback() {
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
                Passwort zurücksetzen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="text-center text-muted-foreground">Laden...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicOnly>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
