# Company Profile Types Documentation

This document describes the TypeScript interfaces for company profile viewing functionality, which match the enhanced PublicCompanyInfo structure from the backend.

## Overview

The company profile types have been updated to support the enhanced company profile viewing feature. These types provide comprehensive typing for all company fields including documents, contact info, and metrics.

## Main Interfaces

### CompanyProfile

The main interface representing complete public company information:

```typescript
interface CompanyProfile {
  // Core identification
  companyId: string;
  name: string;
  companyType: CompanyType;

  // Basic company information
  description?: string;
  website?: string;
  city?: string;

  // Business roles
  isAuftraggeber: boolean; // Can create orders (client)
  isAuftragnehmer: boolean; // Can provide services (provider)

  // Business specialization
  specializations: string[];
  industries: string[];
  orderCategories?: string[];

  // Verification and status
  verified: boolean;
  status?: CompanyStatus;

  // Company details
  foundedYear?: number;
  employeeCount?: number;
  logoUrl?: string;

  // Contact and location
  contactEmail?: string;
  contactPhone?: string;
  address?: Address;
  location?: GeoLocation;
  workRadiusKm?: number;
  businessHours?: string;

  // Legal information
  taxId?: string;
  registrationNumber?: string;
  vatNumber?: string;

  // Quality metrics
  qualityScore?: number;
  completionRate?: number;
  averageResponseHours?: number;
  insuranceCoverage?: boolean;

  // Additional information
  annualRevenue?: number;
  certifications?: string[];

  // Timestamps
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;

  // Documents
  documents?: CompanyDocument[];

  // Computed fields
  businessRoleDescription?: string;
  formattedAddress?: string;
}
```

### CompanyDocument

Interface for company documents (verification, certificates, etc.):

```typescript
interface CompanyDocument {
  id: string;
  type: CompanyDocumentType;
  name: string;
  url: string;
  uploadedAt: string;
  fileSize?: number;
  contentType?: string;
  category?: string;
}
```

### Supporting Interfaces

- **Address**: Physical address information
- **GeoLocation**: Latitude/longitude coordinates
- **ContactInfo**: Contact information details
- **CompanyContactInfo**: Simplified contact info for display
- **CompanyMetrics**: Quality and performance metrics
- **CompanyBusinessInfo**: Business specialization information

## Type Enums

### CompanyType

```typescript
type CompanyType =
  | "GMBH"
  | "AG"
  | "EINZELUNTERNEHMEN"
  | "GBR"
  | "UG"
  | "OHG"
  | "KG"
  | "GMBH_CO_KG"
  | "OTHER";
```

### CompanyStatus

```typescript
type CompanyStatus =
  | "PENDING"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "REJECTED";
```

### CompanyDocumentType

```typescript
type CompanyDocumentType =
  | "VERIFICATION"
  | "CERTIFICATES"
  | "CERTIFICATION_ITEM"
  | "OTHER";
```

## API Response Types

### CompanyProfileResponse

Wrapper for API responses:

```typescript
interface CompanyProfileResponse {
  success: boolean;
  data?: CompanyProfile;
  error?: string;
  message?: string;
}
```

### CompanyProfileLoadingState

For managing loading states:

```typescript
interface CompanyProfileLoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  data?: CompanyProfile | null;
}
```

## Type Guards

The module provides several type guard functions:

- `isCompanyProfileComplete(profile)`: Checks if a profile has all required fields
- `hasContactInfo(profile)`: Checks if contact information is available
- `hasDocuments(profile)`: Checks if company has documents
- `hasQualityMetrics(profile)`: Checks if quality metrics are available

## Usage Examples

### Basic Usage

```typescript
import { CompanyProfile, CompanyDocument } from "@/lib/types/company-profile";

const profile: CompanyProfile = {
  companyId: "123",
  name: "Test Company",
  companyType: "GMBH",
  isAuftraggeber: true,
  isAuftragnehmer: false,
  specializations: ["Software Development"],
  industries: ["Technology"],
  verified: true,
  createdAt: "2024-01-01T00:00:00Z",
};
```

### With Type Guards

```typescript
import {
  isCompanyProfileComplete,
  hasContactInfo,
} from "@/lib/types/company-profile";

if (isCompanyProfileComplete(profile)) {
  // Profile has all required fields
  console.log("Profile is complete");
}

if (hasContactInfo(profile)) {
  // Display contact information
  console.log("Contact info available");
}
```

### API Response Handling

```typescript
import { CompanyProfileResponse } from "@/lib/types/company-profile";

const handleApiResponse = (response: CompanyProfileResponse) => {
  if (response.success && response.data) {
    // Handle successful response
    const profile = response.data;
    console.log(`Company: ${profile.name}`);
  } else {
    // Handle error
    console.error(response.error);
  }
};
```

## Backward Compatibility

The interface includes legacy fields for backward compatibility:

- `contactPersonName?: string`
- `latitude?: number`
- `longitude?: number`

These fields are deprecated in favor of the structured `ContactInfo` and `GeoLocation` interfaces but are maintained to ensure existing code continues to work.

## Integration with Backend

These types are designed to match the enhanced `PublicCompanyInfo` structure from the backend:

- All field names match the backend DTO exactly
- Optional fields are properly typed with `?` operator
- Enums match backend enum values
- Date fields are typed as strings (ISO format expected)

## File Organization

- `company-profile.ts`: Main company profile types and interfaces
- `company.ts`: Re-exports and Zod schemas for forms
- `index.ts`: Central export file for all types
- `validation.ts`: Type validation and compilation testing
- `__tests__/company-profile.test.ts`: Unit tests for type guards and interfaces

## Migration Guide

When updating existing code to use the new types:

1. Import from the new location: `@/lib/types/company-profile`
2. Update hardcoded company type strings to use the `CompanyType` enum
3. Use the new structured interfaces (`ContactInfo`, `GeoLocation`) instead of flat fields
4. Utilize type guards for safer type checking
5. Update API response handling to use the new response types

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **3.1**: Create comprehensive CompanyProfile interface matching enhanced PublicCompanyInfo structure ✅
- **3.1**: Add proper typing for all company fields including documents, contact info, and metrics ✅
- **3.4**: Update existing company-related types to be consistent with new interface ✅
- **3.4**: Add proper null/undefined handling for optional fields ✅