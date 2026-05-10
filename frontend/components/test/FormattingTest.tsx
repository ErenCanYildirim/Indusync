/**
 * Simple test component to verify formatting utilities work
 */

"use client";

import { useLocaleFormatting } from "@/lib/utils/formatting";
import { ProjectBudget, ProjectDate } from "@/components/ui/FormattedDisplay";

export function FormattingTest() {
  const { formatCurrency, formatDateShort, formatNumber, locale } =
    useLocaleFormatting();

  const testData = {
    budget: 15000,
    date: new Date("2024-08-15"),
    number: 1234.56,
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        Formatting Test (Locale: {locale})
      </h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Direct Hook Usage:</strong>
        </div>
        <div>Currency: {formatCurrency(testData.budget)}</div>
        <div>Date: {formatDateShort(testData.date)}</div>
        <div>Number: {formatNumber(testData.number)}</div>

        <div className="mt-4">
          <strong>Component Usage:</strong>
        </div>
        <div>
          Budget Component: <ProjectBudget amount={testData.budget} />
        </div>
        <div>
          Date Component: <ProjectDate date={testData.date} />
        </div>

        <div className="mt-4">
          <strong>Fallback Tests:</strong>
        </div>
        <div>
          No Budget: <ProjectBudget amount={undefined} />
        </div>
        <div>
          No Date: <ProjectDate date={undefined} />
        </div>
      </div>
    </div>
  );
}
