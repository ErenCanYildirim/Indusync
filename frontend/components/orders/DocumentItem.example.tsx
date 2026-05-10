/**
 * DocumentItem Component Usage Example
 * Demonstrates how to use the DocumentItem component
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

"use client";

import React from "react";
import { DocumentItem } from "./DocumentItem";
import { useDownloadOrderDocument } from "@/lib/hooks/useOrders";
import type { OrderDocumentDto } from "@/lib/api/types";

// Example document data
const exampleDocument: OrderDocumentDto = {
  id: "doc-example-123",
  fileName: "project-specification.pdf",
  originalFileName: "project-specification.pdf",
  documentType: "SPECIFICATION",
  description:
    "Detailed project specification document with requirements and technical details",
  fileSize: 2048000, // 2MB
  contentType: "application/pdf",
  uploadedAt: "2024-01-15T14:30:00Z",
  downloadUrl: "https://example.com/download/doc-example-123",
};

/**
 * Example usage of DocumentItem component
 */
export function DocumentItemExample() {
  const downloadDocument = useDownloadOrderDocument();

  const handleDownload = React.useCallback(
    (documentId: string, fileName: string) => {
      downloadDocument.mutate({
        orderId: "order-123", // This would come from props or context
        documentId,
        fileName,
      });
    },
    [downloadDocument]
  );

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Document Item Example</h2>

      <DocumentItem
        document={exampleDocument}
        onDownload={handleDownload}
        isDownloading={downloadDocument.isPending}
        className="mb-4"
      />

      {/* Example with different file types */}
      <DocumentItem
        document={{
          ...exampleDocument,
          id: "doc-image-456",
          fileName: "site-photo.jpg",
          originalFileName: "site-photo.jpg",
          contentType: "image/jpeg",
          fileSize: 512000, // 512KB
          description: "Site photograph showing current conditions",
        }}
        onDownload={handleDownload}
        isDownloading={false}
        className="mb-4"
      />

      <DocumentItem
        document={{
          ...exampleDocument,
          id: "doc-excel-789",
          fileName: "budget-calculation.xlsx",
          originalFileName: "budget-calculation.xlsx",
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize: 128000, // 128KB
          description: undefined, // No description
        }}
        onDownload={handleDownload}
        isDownloading={false}
      />
    </div>
  );
}

export default DocumentItemExample;
