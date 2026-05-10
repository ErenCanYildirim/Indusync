"use client";

import React from "react";
import { PastProjectsList } from "./PastProjectsList";

/**
 * Example usage of PastProjectsList component
 *
 * This example demonstrates how to use the PastProjectsList component
 * with proper props and event handlers.
 */
export const PastProjectsListExample: React.FC = () => {
  // Example company ID (in real usage, this would come from props or context)
  const companyId = "example-company-id";

  // Handle project click navigation
  const handleProjectClick = (orderId: string) => {
    console.log("Navigating to detailed review page for order:", orderId);
    // In real implementation, this would navigate to the detailed review page
    // For example: router.push(`/reviews/order/${orderId}`)
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          PastProjectsList Component Example
        </h1>
        <p className="text-muted-foreground mb-6">
          This example shows the PastProjectsList component displaying completed
          projects with ratings, pagination, and proper error handling.
        </p>
      </div>

      {/* Basic Usage */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Usage</h2>
        <PastProjectsList
          companyId={companyId}
          onProjectClick={handleProjectClick}
        />
      </div>

      {/* Custom Page Size */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">With Custom Page Size</h2>
        <PastProjectsList
          companyId={companyId}
          onProjectClick={handleProjectClick}
          pageSize={5}
          className="border-2 border-dashed border-primary/20"
        />
      </div>

      {/* Usage Notes */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            The component automatically handles loading states while fetching
            data
          </li>
          <li>Error states are displayed with retry functionality</li>
          <li>Empty states are shown when no projects are found</li>
          <li>
            Pagination is automatically displayed when there are multiple pages
          </li>
          <li>
            Each project item shows rating, completion date, and company role
          </li>
          <li>Clicking on a project item calls the onProjectClick callback</li>
        </ul>
      </div>

      {/* Integration Example */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Integration Example:</h3>
        <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
          {`import { PastProjectsList } from '@/components/company'
import { useRouter } from 'next/navigation'

export const CompanyProfilePage = ({ companyId }) => {
  const router = useRouter()

  const handleProjectClick = (orderId) => {
    router.push(\`/reviews/order/\${orderId}\`)
  }

  return (
    <div>
      {/* Other company profile content */}
      <PastProjectsList
        companyId={companyId}
        onProjectClick={handleProjectClick}
        pageSize={10}
      />
    </div>
  )
}`}
        </pre>
      </div>
    </div>
  );
};

export default PastProjectsListExample;