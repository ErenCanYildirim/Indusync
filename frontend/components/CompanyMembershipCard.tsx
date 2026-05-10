"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Shield, Calendar } from "lucide-react";
import { CompanyPermission } from "@/lib/utils/permissions";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations, useLocale } from "next-intl";

export function CompanyMembershipCard() {
  const { user } = useAuth();
  const t = useTranslations("Profile.companyMembership");
  const locale = useLocale();

  if (!user?.currentCompanyMembership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("noMembership")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const membership = user.currentCompanyMembership;
  const activePermissions = getActivePermissions(membership);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {membership.companyName}
        </CardTitle>
        <CardDescription>
          {membership.positionTitle || t(`roles.${membership.role}`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("role")}</span>
          </div>{" "}
          <Badge variant="outline">{t(`roles.${membership.role}`)}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("memberSince")}</span>
          </div>{" "}
          <span className="text-sm text-muted-foreground">
            {format(
              new Date(membership.joinedAt),
              locale === "en" ? "MM/dd/yyyy" : "dd.MM.yyyy",
              {
                locale: locale === "en" ? enUS : de,
              }
            )}
          </span>
        </div>

        {membership.isPrimaryContact && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="text-blue-700 border-blue-200">
              {t("primaryContact")}
            </Badge>
          </div>
        )}

        {activePermissions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("permissions")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {activePermissions.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {t(`permissionNames.${permission}`)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getActivePermissions(membership: any): CompanyPermission[] {
  const permissions: CompanyPermission[] = [];

  if (membership.canCreateOrders) permissions.push("CREATE_ORDERS");
  if (membership.canManageEmployees) permissions.push("MANAGE_EMPLOYEES");
  if (membership.canAssignProjects) permissions.push("ASSIGN_PROJECTS");
  if (membership.canViewFinancials) permissions.push("VIEW_FINANCIALS");
  if (membership.canManageCompanySettings)
    permissions.push("MANAGE_COMPANY_SETTINGS");

  return permissions;
}
