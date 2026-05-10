"use client";

import {
  useTermsConditionsAvailability,
  TermsConditionsAccessButton,
} from "./terms-conditions-access-button";

interface TermsConditionsAccessSectionProps {
  companyId: string;
  companyName: string;
  orderId: string;
}

export function TermsConditionsAccessSection({
  companyId,
  companyName,
  orderId,
}: TermsConditionsAccessSectionProps) {
  const { hasDocument, isLoading } = useTermsConditionsAvailability(companyId);

  // Don't render anything while loading or if no document is available
  if (isLoading || !hasDocument) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Allgemeine Geschäftsbedingungen verfügbar
          </h4>
          <p className="text-xs text-blue-700 mb-3">
            Der Auftraggeber hat AGB hochgeladen. Wir empfehlen Ihnen, diese vor
            der Interessensbekundung zu prüfen.
          </p>
        </div>
      </div>
      <TermsConditionsAccessButton
        companyId={companyId}
        companyName={companyName}
        variant="outline"
        size="sm"
        accessContext="EXPRESSION_OF_INTEREST"
        orderId={orderId}
        showBadge={true}
        className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
        onAccessTracked={(companyId) => {
          console.log(
            `T&C access tracked for company ${companyId} from expression of interest for order ${orderId}`
          );
        }}
        onError={(error) => {
          console.error("T&C access error:", error);
        }}
      />
    </div>
  );
}
