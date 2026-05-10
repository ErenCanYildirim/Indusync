# Terms & Conditions API Documentation

This document provides comprehensive documentation for the Terms & Conditions (T&C) API integration layer in the IndusSync frontend application.

## Overview

The Terms & Conditions API provides functionality for:

- Uploading PDF documents as company Terms & Conditions
- Retrieving T&C documents with secure access
- Tracking document access for audit purposes
- Managing T&C document lifecycle (upload, view, delete)
- Validating files and handling errors gracefully

## API Functions

### Core API Functions (companyApi)

All T&C functions are integrated into the main `companyApi` object for consistency with existing patterns.

#### `uploadTermsConditions(companyId: string, file: File): Promise<TermsConditionsResponse>`

Uploads a Terms & Conditions PDF document for a company.

**Parameters:**

- `companyId`: The company ID to upload T&C for
- `file`: PDF file to upload (max 10MB)

**Returns:** Promise resolving to upload response with document metadata

**Example:**

```typescript
import { companyApi } from "@/lib/api/company";

const response = await companyApi.uploadTermsConditions("company-123", pdfFile);
console.log("Uploaded:", response.fileName);
```

#### `getTermsConditions(companyId: string): Promise<GetTermsConditionsResponse>`

Retrieves Terms & Conditions document information for a company.

**Parameters:**

- `companyId`: The company ID to get T&C for

**Returns:** Promise resolving to document info or null if not found

**Example:**

```typescript
const response = await companyApi.getTermsConditions("company-123");
if (response.hasDocument) {
  console.log("Document:", response.document.fileName);
}
```

#### `deleteTermsConditions(companyId: string): Promise<void>`

Deletes the Terms & Conditions document for a company.

**Parameters:**

- `companyId`: The company ID to delete T&C for

**Example:**

```typescript
await companyApi.deleteTermsConditions("company-123");
console.log("Document deleted");
```

#### `getTermsConditionsUrl(companyId: string): Promise<string>`

Gets a secure URL for accessing the Terms & Conditions document.

**Parameters:**

- `companyId`: The company ID to get document URL for

**Returns:** Promise resolving to secure document URL

**Example:**

```typescript
const url = await companyApi.getTermsConditionsUrl("company-123");
window.open(url, "_blank");
```

#### `trackTermsConditionsAccess(accessRequest: TermsConditionsAccessRequest): Promise<TermsConditionsAccessResponse>`

Tracks access to Terms & Conditions documents for audit purposes.

**Parameters:**

- `accessRequest`: Access tracking information including document ID, context, and optional order ID

**Example:**

```typescript
await companyApi.trackTermsConditionsAccess({
  documentId: "doc-123",
  accessContext: "ORDER_DETAIL",
  orderId: "order-456",
});
```

#### `hasTermsConditions(companyId: string): Promise<boolean>`

Checks if a company has uploaded Terms & Conditions documents.

**Parameters:**

- `companyId`: The company ID to check

**Returns:** Promise resolving to boolean indicating document availability

**Example:**

```typescript
const hasTC = await companyApi.hasTermsConditions("company-123");
if (hasTC) {
  // Show T&C access button
}
```

## Utility Functions

### File Validation

#### `validateTermsConditionsFile(file: File): { isValid: boolean, error?: string }`

Validates a file before upload to ensure it meets T&C requirements.

**Validation Rules:**

- File must be provided
- File type must be `application/pdf`
- File size must not exceed 10MB

**Example:**

```typescript
import { validateTermsConditionsFile } from "@/lib/utils/terms-conditions";

const validation = validateTermsConditionsFile(file);
if (!validation.isValid) {
  console.error("Validation failed:", validation.error);
  return;
}
```

### Document Access with Tracking

#### `getTermsConditionsWithTracking(companyId: string, accessContext: AccessContext, orderId?: string)`

Convenience function that combines document retrieval with access tracking.

**Parameters:**

- `companyId`: Company ID to get T&C for
- `accessContext`: Context where document is accessed ('ORDER_DETAIL', 'COMPANY_PROFILE', 'EXPRESSION_OF_INTEREST')
- `orderId`: Optional order ID for context

**Example:**

```typescript
import { getTermsConditionsWithTracking } from "@/lib/utils/terms-conditions";

const { document, url } = await getTermsConditionsWithTracking(
  "company-123",
  "ORDER_DETAIL",
  "order-456"
);

if (document) {
  // Display document info and provide access
}
```

### File Operations

#### `formatFileSize(bytes: number): string`

Formats file size in bytes to human-readable format.

**Example:**

```typescript
import { formatFileSize } from "@/lib/utils/terms-conditions";

console.log(formatFileSize(2048576)); // "2 MB"
```

#### `openTermsConditionsDocument(url: string, companyName: string): void`

Opens T&C document in a new browser window/tab.

#### `downloadTermsConditionsDocument(url: string, fileName: string): void`

Triggers download of T&C document.

## Error Handling

### Error Handler Functions

The API includes comprehensive error handling utilities:

#### `handleTermsConditionsError(error: any): string`

Converts API errors to user-friendly messages.

#### `isRetryableTermsConditionsError(error: any): boolean`

Determines if an error can be retried.

#### `getTermsConditionsRetryDelay(error: any, attemptNumber: number): number`

Calculates appropriate retry delay for retryable errors.

**Example:**

```typescript
import {
  handleTermsConditionsError,
  isRetryableTermsConditionsError,
  getTermsConditionsRetryDelay,
} from "@/lib/api/terms-conditions-error-handler";

try {
  await companyApi.uploadTermsConditions(companyId, file);
} catch (error) {
  const message = handleTermsConditionsError(error);

  if (isRetryableTermsConditionsError(error)) {
    const delay = getTermsConditionsRetryDelay(error, 1);
    // Implement retry logic
  }

  console.error(message);
}
```

## TypeScript Interfaces

### Core Types

```typescript
interface TermsConditionsDocument {
  id: string;
  companyId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  isActive: boolean;
  version: number;
  checksum: string;
}

interface TermsConditionsResponse {
  documentId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  isActive: boolean;
  version: number;
  success: boolean;
  message: string;
}

interface GetTermsConditionsResponse {
  document: TermsConditionsResponse | null;
  hasDocument: boolean;
}
```

### Access Tracking Types

```typescript
type AccessContext =
  | "ORDER_DETAIL"
  | "COMPANY_PROFILE"
  | "EXPRESSION_OF_INTEREST";

interface TermsConditionsAccessRequest {
  documentId: string;
  accessContext: AccessContext;
  orderId?: string;
}
```

## Query Keys

For use with TanStack Query:

```typescript
import { queryKeys } from "@/lib/api/types";

// Terms & Conditions document
queryKeys.company.termsConditions(companyId);

// Terms & Conditions URL
queryKeys.company.termsConditionsUrl(companyId);
```

## Integration Examples

### Company Profile Integration

```typescript
// In company profile component
const { data: tcDocument } = useQuery({
  queryKey: queryKeys.company.termsConditions(companyId),
  queryFn: () => companyApi.getTermsConditions(companyId),
});

const uploadMutation = useMutation({
  mutationFn: (file: File) => companyApi.uploadTermsConditions(companyId, file),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.company.termsConditions(companyId),
    });
  },
});
```

### Order Detail Integration

```typescript
// In order detail component
const handleViewTermsConditions = async () => {
  const { document, url } = await getTermsConditionsWithTracking(
    order.companyId,
    "ORDER_DETAIL",
    order.id
  );

  if (url) {
    openTermsConditionsDocument(url, order.companyName);
  }
};
```

## Security Considerations

1. **File Validation**: All files are validated client-side and server-side
2. **Secure URLs**: Document access uses signed URLs with expiration
3. **Access Tracking**: All document access is logged for audit purposes
4. **Authorization**: Proper permission checks before document operations
5. **Malware Scanning**: Server-side scanning for uploaded documents

## Performance Considerations

1. **File Size Limits**: 10MB maximum to prevent performance issues
2. **Caching**: Appropriate caching strategies for document metadata
3. **Lazy Loading**: Documents loaded only when requested
4. **CDN Integration**: Documents served through CDN for optimal performance

## Best Practices

1. **Always validate files** before upload using `validateTermsConditionsFile`
2. **Use access tracking** when displaying documents to users
3. **Handle errors gracefully** with user-friendly messages
4. **Implement retry logic** for retryable errors
5. **Cache document availability** to avoid repeated API calls
6. **Use secure URLs** and never expose direct file paths
7. **Track all access** for compliance and audit purposes

## Testing

The API includes comprehensive error scenarios and edge cases. Test files should cover:

- File validation (type, size, content)
- Upload success and failure scenarios
- Document retrieval with and without documents
- Access tracking functionality
- Error handling and retry logic
- Security and authorization checks

## Migration Notes

When integrating this API:

1. Update company profile components to include T&C management
2. Add T&C access buttons to order detail pages
3. Include T&C availability in company profile displays
4. Implement proper error boundaries for T&C components
5. Add internationalization for all T&C-related text
6. Test accessibility compliance for all T&C interfaces