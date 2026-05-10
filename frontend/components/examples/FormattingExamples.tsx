/**
 * Formatting Example Component
 * Demonstrates the usage of locale-aware formatting utilities
 * This component can be used for testing and as a reference for developers
 *
 * @author IndusSync Frontend Team
 * @since Multi-language Support Implementation
 */

"use client";

import { useLocaleFormatting } from "@/lib/utils/formatting";
import {
  FormattedCurrency,
  FormattedNumber,
  FormattedDate,
  FormattedDateShort,
  FormattedDateMedium,
  FormattedTime,
  FormattedRelativeTime,
  FormattedPercentage,
  ProjectBudget,
  ProjectDate,
} from "@/components/ui/FormattedDisplay";

export function FormattingExample() {
  const { locale, timeZone } = useLocaleFormatting();

  // Sample data for demonstration
  const sampleData = {
    budget: 15000,
    smallAmount: 1234.56,
    largeNumber: 1234567.89,
    percentage: 0.15,
    currentDate: new Date(),
    pastDate: new Date("2024-01-15"),
    futureDate: new Date("2024-12-25"),
    projectDeadline: "2024-08-15T14:30:00Z",
  };

  return (
    <div className="p-6 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Locale-Aware Formatting Examples
        </h2>
        <p className="text-gray-600">
          Current locale:{" "}
          <span className="font-mono font-semibold">{locale}</span> | Timezone:{" "}
          <span className="font-mono font-semibold">{timeZone}</span>
        </p>
      </div>

      {/* Currency Formatting */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Currency Formatting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Project Budget (EUR):</span>
            <div className="font-semibold text-green-600">
              <FormattedCurrency amount={sampleData.budget} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Small Amount (USD):</span>
            <div className="font-semibold text-green-600">
              <FormattedCurrency
                amount={sampleData.smallAmount}
                currency="USD"
              />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Project Budget Component:</span>
            <div className="font-semibold text-green-600">
              <ProjectBudget amount={sampleData.budget} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">No Budget:</span>
            <div className="font-semibold text-gray-500">
              <ProjectBudget
                amount={undefined}
                fallbackText="Budget not specified"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Number Formatting */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Number Formatting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Large Number:</span>
            <div className="font-semibold text-blue-600">
              <FormattedNumber value={sampleData.largeNumber} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Decimal Number:</span>
            <div className="font-semibold text-blue-600">
              <FormattedNumber
                value={sampleData.smallAmount}
                options={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Percentage:</span>
            <div className="font-semibold text-purple-600">
              <FormattedPercentage value={sampleData.percentage} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Percentage (1 decimal):</span>
            <div className="font-semibold text-purple-600">
              <FormattedPercentage
                value={sampleData.percentage}
                options={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Date Formatting */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Date Formatting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Current Date (Short):</span>
            <div className="font-semibold text-indigo-600">
              <FormattedDateShort date={sampleData.currentDate} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Current Date (Medium):</span>
            <div className="font-semibold text-indigo-600">
              <FormattedDateMedium date={sampleData.currentDate} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Project Deadline:</span>
            <div className="font-semibold text-indigo-600">
              <ProjectDate date={sampleData.projectDeadline} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Custom Format:</span>
            <div className="font-semibold text-indigo-600">
              <FormattedDate
                date={sampleData.currentDate}
                options={{
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Time Formatting */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Time Formatting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Current Time:</span>
            <div className="font-semibold text-orange-600">
              <FormattedTime date={sampleData.currentDate} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Time with Seconds:</span>
            <div className="font-semibold text-orange-600">
              <FormattedTime
                date={sampleData.currentDate}
                options={{
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }}
              />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Relative Time (Past):</span>
            <div className="font-semibold text-red-600">
              <FormattedRelativeTime date={sampleData.pastDate} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Relative Time (Future):</span>
            <div className="font-semibold text-green-600">
              <FormattedRelativeTime date={sampleData.futureDate} />
            </div>
          </div>
        </div>
      </section>

      {/* Combined Examples */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Real-world Examples
        </h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2">
              Project Card Example
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Budget: </span>
                <ProjectBudget
                  amount={sampleData.budget}
                  className="font-semibold text-green-600"
                />
              </div>
              <div>
                <span className="text-gray-600">Deadline: </span>
                <ProjectDate
                  date={sampleData.projectDeadline}
                  className="font-semibold text-blue-600"
                />
              </div>
              <div>
                <span className="text-gray-600">Applications: </span>
                <FormattedNumber
                  value={42}
                  className="font-semibold text-purple-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-2">
              Financial Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Revenue: </span>
                <FormattedCurrency
                  amount={125000}
                  className="font-bold text-green-600"
                />
              </div>
              <div>
                <span className="text-gray-600">Growth Rate: </span>
                <FormattedPercentage
                  value={0.125}
                  className="font-bold text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}