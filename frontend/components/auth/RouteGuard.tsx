/**
 * Route Guard Component
 * Protects routes based on user permissions and redirects unauthorized users
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermissions?: Array<
    "canCreateOrders" | "canUseMatchingPreview" | "canProvideServices"
  >;
  fallbackPath?: string;
  fallbackMessage?: string;
}

export function RouteGuard({
    children,
    requiredPermissions = [],
    fallbackPath = "/dashboard",
    fallbackMessage = "Sie haben keine Berechtigung, diese Seite zu besuchen.",
} : RouteGuardProps) {

    const { isAuthenticated, isLoadingUser } = useAuth();
    const permissions = usePermissions();
    const router = useRouter();

    useEffect(() => {
        if (isLoadingUser) return;

        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        // check required permissions
        if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every((permission) => 
                permissions.hasPermission(permission)
            );

            if (!hasAllPermissions) {
                console.warn(
                    "RouteGuard: User lacks required permissions:",
                    requiredPermissions
                );
                // add toast notification?
                router.push(fallbackPath);
                return;
            }
        }
    }, [
        isAuthenticated,
        isLoadingUser,
        permissions,
        requiredPermissions,
        router,
        fallbackPath,
    ]);

    // Show loading while checking permissions
    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Lade...</span>
                </div>
            </div>
        );
    }

    // Show loading while redirecting
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Weiterleitung...</span>
                </div>
            </div>
        );
    }

    // Check permissions after auth is loaded
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every((permission) =>
        permissions.hasPermission(permission)
        );

        if (!hasAllPermissions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
            <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Weiterleitung...</span>
            </div>
            </div>
        );
        }
    }

    return <>{children}</>;
}