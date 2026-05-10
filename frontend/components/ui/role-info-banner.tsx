"use client";

/**
 * Role Information Banner Component
 * Shows users their current role and available permissions
 */

import { usePermissions } from "@/lib/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, FileText, Search, Users, AlertCircle } from "lucide-react";

interface RoleInfoBannerProps {
  className?: string;
  showDetails?: boolean;
}

export function RoleInfoBanner({
  className = "",
  showDetails = true,
}: RoleInfoBannerProps) {
  const {
    companyRole,
    roleDisplayName,
    primaryActivity,
    canCreateOrders,
    canUseMatchingPreview,
    canProvideServices,
    isClient,
    isProvider,
    hasBothRoles,
    companyProfile,
    isLoadingCompanyProfile,
    isAuftraggeber,
    isAuftragnehmer,
  } = usePermissions();

  if (isLoadingCompanyProfile) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              Lade Unternehmensprofil...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!companyRole) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Unternehmensprofil nicht konfiguriert
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Bitte konfigurieren Sie Ihr Unternehmensprofil, um die
                verfügbaren Funktionen zu nutzen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />

          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Ihr Unternehmensprofil:
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {roleDisplayName}
              </Badge>
            </div>

            {showDetails && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{primaryActivity}</p>

                {/* Role Configuration Details */}
                <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Rollenkonfiguration:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isAuftraggeber ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span className="text-xs text-gray-600">
                        Auftraggeber (Client):{" "}
                        {isAuftraggeber ? "Aktiviert" : "Deaktiviert"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isAuftragnehmer ? "bg-purple-500" : "bg-gray-300"
                        }`}
                      />
                      <span className="text-xs text-gray-600">
                        Auftragnehmer (Provider):{" "}
                        {isAuftragnehmer ? "Aktiviert" : "Deaktiviert"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Available Permissions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {canCreateOrders && (
                    <div className="flex items-center space-x-1 text-xs text-green-700">
                      <FileText className="h-3 w-3" />
                      <span>Aufträge erstellen</span>
                    </div>
                  )}

                  {canUseMatchingPreview && (
                    <div className="flex items-center space-x-1 text-xs text-blue-700">
                      <Search className="h-3 w-3" />
                      <span>Anbieter suchen</span>
                    </div>
                  )}

                  {canProvideServices && (
                    <div className="flex items-center space-x-1 text-xs text-purple-700">
                      <Users className="h-3 w-3" />
                      <span>Dienstleistungen anbieten</span>
                    </div>
                  )}
                </div>

                {hasBothRoles && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Sie haben beide Rollen und können alle Funktionen nutzen.
                  </p>
                )}

                {!isAuftraggeber && !isAuftragnehmer && (
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ Keine Rollen konfiguriert. Bitte aktualisieren Sie Ihr
                    Unternehmensprofil.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
