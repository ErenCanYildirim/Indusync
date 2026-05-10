"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  LoadingSpinner,
  FullPageLoader,
} from "@/components/ui/loading-spinner";
import { useTranslations } from "next-intl";

interface RouteProtectionProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requiredRoles?: string[];
  requiredAccountTypes?: ("PERSONAL" | "BUSINESS")[];
  redirectTo?: string;
  fallback?: ReactNode;
  loadingText?: string;
}

/**
 * RouteProtection component that handles authentication and authorization
 *
 * @param children - The protected content to render
 * @param requireAuth - Whether authentication is required (default: true)
 * @param requireEmailVerified - Whether email verification is required
 * @param requiredRoles - Array of required user roles
 * @param requiredAccountTypes - Array of required account types
 * @param redirectTo - Where to redirect if not authorized (default: '/login')
 * @param fallback - Custom fallback component when not authorized
 * @param loadingText - Custom loading text
 */
export const RouteProtection = ({
  children,
  requireAuth = true,
  requireEmailVerified = false,
  requiredRoles = [],
  requiredAccountTypes = [],
  redirectTo = "/login",
  fallback,
  loadingText,
}: RouteProtectionProps) => {
  const t = useTranslations("Common");
  const {
    user,
    isAuthenticated,
    isLoadingUser: isLoading,
    hasToken,
    isEmailVerified,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run redirects after component is mounted on client
    if (!isMounted) return;

    // Don't redirect while loading
    if (isLoading) return;

    const isPublicPage = ["/login", "/registrieren", "/verify-email"].includes(
      pathname
    );

    // If auth is required and user is not authenticated, redirect to login
    if (requireAuth && !isAuthenticated) {
      if (!isPublicPage) {
        router.push(redirectTo);
      }
      return;
    }

    // If user is authenticated, check for email verification
    if (
      isAuthenticated &&
      requireEmailVerified &&
      !isEmailVerified &&
      pathname !== "/verify-email"
    ) {
      router.push("/verify-email");
      return;
    }

    // If user is authenticated, check role/account type requirements
    if (isAuthenticated && user) {
      // Check required roles
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some((role) =>
          user.roles?.includes(role)
        );
        if (!hasRequiredRole) {
          router.push("/unauthorized");
          return;
        }
      }

      // Check required account types
      if (requiredAccountTypes.length > 0) {
        const hasRequiredAccountType = requiredAccountTypes.includes(
          user.accountType
        );
        if (!hasRequiredAccountType) {
          router.push("/unauthorized");
          return;
        }
      }
    }
  }, [
    isMounted,
    isAuthenticated,
    isLoading,
    user,
    requireAuth,
    requiredRoles,
    requiredAccountTypes,
    router,
    redirectTo,
    hasToken,
    isEmailVerified,
    requireEmailVerified,
    pathname,
  ]);

  // Show consistent loading state until mounted and auth is determined
  if (!isMounted || isLoading) {
    return <FullPageLoader text={loadingText || t("status.loading")} />;
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      fallback || <FullPageLoader text={loadingText || t("status.loading")} />
    );
  }

  // If email verification is required but not completed
  if (
    requireAuth &&
    isAuthenticated &&
    requireEmailVerified &&
    !isEmailVerified
  ) {
    // We are already redirecting, but this prevents flashing the content
    // We can show a specific component here if we want.
    return <FullPageLoader text={t("status.loading")} />;
  }

  // If user is authenticated but doesn't have required permissions
  if (isAuthenticated && user) {
    // Check roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) =>
        user.roles?.includes(role)
      );
      if (!hasRequiredRole) {
        return fallback || <UnauthorizedAccess />;
      }
    }

    // Check account types
    if (requiredAccountTypes.length > 0) {
      const hasRequiredAccountType = requiredAccountTypes.includes(
        user.accountType
      );
      if (!hasRequiredAccountType) {
        return fallback || <UnauthorizedAccess />;
      }
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

/**
 * Unauthorized access component
 */
const UnauthorizedAccess = () => {
  const t = useTranslations("Common");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">
          {t("actions.unauthorized")}
        </h1>
        <p className="text-muted-foreground">
          {t("actions.unauthorizedDescription")}
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          {t("actions.back")}
        </button>
      </div>
    </div>
  );
};

/**
 * Higher-order component for page-level protection
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  protectionOptions?: Omit<RouteProtectionProps, "children">
) => {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteProtection {...protectionOptions}>
        <Component {...props} />
      </RouteProtection>
    );
  };
};

/**
 * Specialized components for common use cases
 */

// For business account only pages
export const BusinessOnly = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("Common");
  return (
    <RouteProtection
      requiredAccountTypes={["BUSINESS"]}
      loadingText={t("status.loading")}
    >
      {children}
    </RouteProtection>
  );
};

// For personal account only pages
export const PersonalOnly = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("Common");
  return (
    <RouteProtection
      requiredAccountTypes={["PERSONAL"]}
      loadingText={t("status.loading")}
    >
      {children}
    </RouteProtection>
  );
};

// For admin only pages
export const AdminOnly = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("Common");
  return (
    <RouteProtection
      requiredRoles={["admin"]}
      loadingText={t("status.loading")}
    >
      {children}
    </RouteProtection>
  );
};

// For public pages that should redirect authenticated users
export const PublicOnly = ({
  children,
  redirectTo = "/dashboard",
}: {
  children: ReactNode;
  redirectTo?: string;
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslations("Common");

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after component is mounted on client
    if (!isMounted) return;

    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isMounted, isAuthenticated, isLoading, router, redirectTo]);

  // Show consistent loading state until mounted and auth is determined
  if (!isMounted || isLoading) {
    return <FullPageLoader text={t("status.loading")} />;
  }

  if (isAuthenticated) {
    return <FullPageLoader text={t("status.loading")} />;
  }

  return <>{children}</>;
};

export default RouteProtection;
