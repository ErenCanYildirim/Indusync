"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { hasPermission, CompanyPermission } from "@/lib/utils/permissions";
import { ReactNode } from "react";

interface PermissionGuardProps {
  permission: CompanyPermission;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that renders children only if user has the required permission
 * in their current company membership
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user?.currentCompanyMembership) {
    return <>{fallback}</>;
  }

  if (!hasPermission(user.currentCompanyMembership, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that renders children only if user has one of the allowed roles
 */
export function RoleGuard({
  allowedRoles,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { user } = useAuth();

  if (!user?.currentCompanyMembership) {
    return <>{fallback}</>;
  }

  if (!allowedRoles.includes(user.currentCompanyMembership.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
