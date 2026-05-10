/**
 * Dynamic Content Translation Example
 *
 * This example demonstrates how to use the dynamic content translation utilities
 * to handle role-specific metric descriptions and tooltips from the backend.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Internationalization Implementation
 */

import React from "react";
import { useDynamicContentTranslation } from "../dynamic-content-translation";

// Example backend data that might come from the API
const exampleBackendData = {
  // German content from backend (current implementation)
  germanRoleContext: {
    activeOrdersDescription:
      "Übersicht Ihrer laufenden Aufträge als Auftraggeber",
    activeOrdersTooltip: "Anzahl der derzeit aktiven Aufträge",
    openApplicationsDescription:
      "Bewerbungen auf Ihre veröffentlichten Aufträge",
    openApplicationsTooltip: "Anzahl der eingegangenen Bewerbungen",
    completedOrdersDescription: "Erfolgreich abgeschlossene Projekte",
    completedOrdersTooltip: "Anzahl der abgeschlossenen Aufträge",
    responseTimeDescription: "Durchschnittliche Reaktionszeit auf Aufträge",
    responseTimeTooltip: "Durchschnittliche Zeit bis zur ersten Antwort",
    isDualRole: false,
    isClient: true,
    isProvider: false,
  },

  // English content from backend (future implementation)
  englishRoleContext: {
    activeOrdersDescription: "Overview of your running orders as a client",
    activeOrdersTooltip: "Number of currently active orders",
    openApplicationsDescription: "Applications on your published orders",
    openApplicationsTooltip: "Number of received applications",
    completedOrdersDescription: "Successfully completed projects",
    completedOrdersTooltip: "Number of completed orders",
    responseTimeDescription: "Average response time on orders",
    responseTimeTooltip: "Average time to first response",
    isDualRole: false,
    isClient: true,
    isProvider: false,
  },

  // Role contexts for different scenarios
  clientRoleContext: {
    isDualRole: false,
    isClient: true,
    isProvider: false,
  },

  providerRoleContext: {
    isDualRole: false,
    isClient: false,
    isProvider: true,
  },

  dualRoleContext: {
    isDualRole: true,
    isClient: true,
    isProvider: true,
  },
};

/**
 * Example component showing how to use dynamic content translation
 */
export const DynamicContentTranslationExample: React.FC = () => {
  const { translateRoleContextContent, translateDynamicContent } =
    useDynamicContentTranslation();

  // Example 1: Translate German content for a client role
  const clientTranslatedContent = translateRoleContextContent(
    exampleBackendData.germanRoleContext,
    exampleBackendData.clientRoleContext
  );

  // Example 2: Translate German content for a provider role
  const providerTranslatedContent = translateRoleContextContent(
    exampleBackendData.germanRoleContext,
    exampleBackendData.providerRoleContext
  );

  // Example 3: Translate German content for a dual role
  const dualRoleTranslatedContent = translateRoleContextContent(
    exampleBackendData.germanRoleContext,
    exampleBackendData.dualRoleContext
  );

  // Example 4: Handle English content (should pass through)
  const englishTranslatedContent = translateRoleContextContent(
    exampleBackendData.englishRoleContext,
    exampleBackendData.clientRoleContext
  );

  // Example 5: Individual content translation
  const individualTranslation = translateDynamicContent(
    "Übersicht Ihrer laufenden Aufträge",
    "activeOrders",
    "description",
    exampleBackendData.clientRoleContext
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">
        Dynamic Content Translation Examples
      </h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Client Role Translation
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Active Orders Description:</strong>{" "}
              {clientTranslatedContent.activeOrdersDescription}
            </p>
            <p>
              <strong>Active Orders Tooltip:</strong>{" "}
              {clientTranslatedContent.activeOrdersTooltip}
            </p>
            <p>
              <strong>Open Applications Description:</strong>{" "}
              {clientTranslatedContent.openApplicationsDescription}
            </p>
            <p>
              <strong>Response Time Description:</strong>{" "}
              {clientTranslatedContent.responseTimeDescription}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            Provider Role Translation
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Active Orders Description:</strong>{" "}
              {providerTranslatedContent.activeOrdersDescription}
            </p>
            <p>
              <strong>Active Orders Tooltip:</strong>{" "}
              {providerTranslatedContent.activeOrdersTooltip}
            </p>
            <p>
              <strong>Open Applications Description:</strong>{" "}
              {providerTranslatedContent.openApplicationsDescription}
            </p>
            <p>
              <strong>Response Time Description:</strong>{" "}
              {providerTranslatedContent.responseTimeDescription}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Dual Role Translation</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Active Orders Description:</strong>{" "}
              {dualRoleTranslatedContent.activeOrdersDescription}
            </p>
            <p>
              <strong>Active Orders Tooltip:</strong>{" "}
              {dualRoleTranslatedContent.activeOrdersTooltip}
            </p>
            <p>
              <strong>Open Applications Description:</strong>{" "}
              {dualRoleTranslatedContent.openApplicationsDescription}
            </p>
            <p>
              <strong>Response Time Description:</strong>{" "}
              {dualRoleTranslatedContent.responseTimeDescription}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            English Content (Pass-through)
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Active Orders Description:</strong>{" "}
              {englishTranslatedContent.activeOrdersDescription}
            </p>
            <p>
              <strong>Active Orders Tooltip:</strong>{" "}
              {englishTranslatedContent.activeOrdersTooltip}
            </p>
            <p>
              <strong>Note:</strong> English content should pass through
              unchanged
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Individual Translation</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Original German:</strong> "Übersicht Ihrer laufenden
              Aufträge"
            </p>
            <p>
              <strong>Translated:</strong> {individualTranslation}
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            German content from backend is detected and translated using
            role-specific keys
          </li>
          <li>English content passes through unchanged</li>
          <li>
            Role context determines which translation keys to use (client,
            provider, dual)
          </li>
          <li>
            Fallback to default translations if role-specific ones don't exist
          </li>
          <li>
            Ultimate fallback to backend content if no translations are
            available
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DynamicContentTranslationExample;