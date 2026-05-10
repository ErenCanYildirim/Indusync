/**
 * EmptyDocumentsState Component Example
 * Example usage of the EmptyDocumentsState component
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

import React from "react";
import { EmptyDocumentsState } from "./EmptyDocumentsState";

export function EmptyDocumentsStateExample() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Backend Order Empty State
        </h2>
        <EmptyDocumentsState isBackendOrder={true} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Mock Project Empty State</h2>
        <EmptyDocumentsState isBackendOrder={false} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">With Custom Styling</h2>
        <EmptyDocumentsState
          isBackendOrder={true}
          className="border-2 border-blue-200"
        />
      </div>
    </div>
  );
}
