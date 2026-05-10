/**
 * Example usage of CompanyRatingsSection component
 *
 * This file demonstrates how to use the CompanyRatingsSection component
 * in different scenarios and with various props.
 */

import React from "react";
import { CompanyRatingsSection } from "./CompanyRatingsSection";

/**
 * Basic usage example
 */
export const BasicUsageExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Company Profile</h1>

      <CompanyRatingsSection companyId="example-company-id" />
    </div>
  );
};

/**
 * Usage with project click handler
 */
export const WithProjectClickExample: React.FC = () => {
  const handleProjectClick = (orderId: string) => {
    console.log("Navigating to project details:", orderId);
    // In a real application, this would navigate to the detailed review page
    // For example: router.push(`/reviews/order/${orderId}`)
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Company Profile with Navigation
      </h1>

      <CompanyRatingsSection
        companyId="example-company-id"
        onProjectClick={handleProjectClick}
      />
    </div>
  );
};

/**
 * Usage with custom styling
 */
export const WithCustomStylingExample: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        Company Profile - Custom Layout
      </h1>

      <CompanyRatingsSection
        companyId="example-company-id"
        className="bg-gray-50 p-6 rounded-lg"
        onProjectClick={(orderId) => {
          // Custom navigation logic
          window.open(`/reviews/order/${orderId}`, "_blank");
        }}
      />
    </div>
  );
};

/**
 * Integration example in a company profile page
 */
export const CompanyProfilePageExample: React.FC = () => {
  const companyId = "example-company-id";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Example Company GmbH</h1>
          <p className="text-muted-foreground">
            Software Development & Consulting
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company info sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Company Information
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Founded</span>
                  <p className="font-medium">2020</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Employees
                  </span>
                  <p className="font-medium">25-50</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Location
                  </span>
                  <p className="font-medium">Berlin, Germany</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area with ratings */}
          <div className="lg:col-span-2">
            <CompanyRatingsSection
              companyId={companyId}
              onProjectClick={(orderId) => {
                // Navigate to detailed review page
                console.log(`Navigating to /reviews/order/${orderId}`);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * Error handling example
 */
export const ErrorHandlingExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Error Handling Example</h1>

      {/* This will trigger an error due to invalid company ID */}
      <CompanyRatingsSection
        companyId=""
        onProjectClick={(orderId) => {
          console.log("Project clicked:", orderId);
        }}
      />
    </div>
  );
};

/**
 * Loading state example
 */
export const LoadingStateExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Loading State Example</h1>

      {/* This will show loading state if API is slow */}
      <CompanyRatingsSection companyId="slow-loading-company-id" />
    </div>
  );
};

export default {
  BasicUsageExample,
  WithProjectClickExample,
  WithCustomStylingExample,
  CompanyProfilePageExample,
  ErrorHandlingExample,
  LoadingStateExample,
};