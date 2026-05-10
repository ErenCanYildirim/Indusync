/**
 * Tests for company profile types
 */

import {
    CompanyProfile,
    CompanyDocument,
    isCompanyProfileComplete,
    hasContactInfo,
    hasDocuments,
    hasQualityMetrics,
    CompanyType,
    CompanyStatus
} from '../company-profile';

describe('CompanyProfile Types', () => {
    const mockCompanyProfile: CompanyProfile = {
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Company GmbH',
        companyType: 'GMBH' as CompanyType,
        description: 'A test company for unit testing',
        website: 'https://test-company.de',
        city: 'Berlin',
        isAuftraggeber: true,
        isAuftragnehmer: false,
        specializations: ['Software Development', 'Web Design'],
        industries: ['Technology', 'Digital Services'],
        verified: true,
        foundedYear: 2020,
        employeeCount: 25,
        logoUrl: 'https://example.com/logo.png',
        contactEmail: 'contact@test-company.de',
        contactPhone: '+49 30 12345678',
        address: {
            street: 'Musterstraße',
            houseNumber: '123',
            postalCode: '10115',
            city: 'Berlin',
            country: 'Deutschland'
        },
        location: {
            latitude: 52.5200,
            longitude: 13.4050
        },
        workRadiusKm: 50,
        businessHours: 'Mo-Fr 9:00-18:00',
        taxId: 'DE123456789',
        registrationNumber: 'HRB 12345',
        vatNumber: 'DE123456789',
        qualityScore: 4.5,
        completionRate: 95.5,
        averageResponseHours: 2,
        insuranceCoverage: true,
        annualRevenue: 1000000,
        certifications: ['ISO 9001', 'ISO 27001'],
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        verifiedAt: '2020-02-01T00:00:00Z',
        status: 'ACTIVE' as CompanyStatus,
        documents: [
            {
                id: 'doc-1',
                type: 'VERIFICATION',
                name: 'Handelsregisterauszug',
                url: 'https://example.com/doc1.pdf',
                uploadedAt: '2020-01-15T00:00:00Z',
                fileSize: 1024000,
                contentType: 'application/pdf',
                category: 'Legal Documents'
            }
        ],
        businessRoleDescription: 'Auftraggeber',
        formattedAddress: 'Musterstraße 123, 10115 Berlin, Deutschland'
    };

    describe('isCompanyProfileComplete', () => {
        it('should return true for a complete company profile', () => {
            expect(isCompanyProfileComplete(mockCompanyProfile)).toBe(true);
        });

        it('should return false for incomplete company profile', () => {
            const incompleteProfile = { ...mockCompanyProfile };
            delete (incompleteProfile as any).companyId;
            expect(isCompanyProfileComplete(incompleteProfile)).toBe(false);
        });

        it('should return false when required arrays are missing', () => {
            const incompleteProfile = { ...mockCompanyProfile };
            delete (incompleteProfile as any).specializations;
            expect(isCompanyProfileComplete(incompleteProfile)).toBe(false);
        });
    });

    describe('hasContactInfo', () => {
        it('should return true when contact email is present', () => {
            expect(hasContactInfo(mockCompanyProfile)).toBe(true);
        });

        it('should return true when contact phone is present', () => {
            const profileWithPhone = { ...mockCompanyProfile, contactEmail: undefined };
            expect(hasContactInfo(profileWithPhone)).toBe(true);
        });

        it('should return true when address is present', () => {
            const profileWithAddress = {
                ...mockCompanyProfile,
                contactEmail: undefined,
                contactPhone: undefined
            };
            expect(hasContactInfo(profileWithAddress)).toBe(true);
        });

        it('should return false when no contact info is present', () => {
            const profileWithoutContact = {
                ...mockCompanyProfile,
                contactEmail: undefined,
                contactPhone: undefined,
                address: undefined,
                businessHours: undefined
            };
            expect(hasContactInfo(profileWithoutContact)).toBe(false);
        });
    });

    describe('hasDocuments', () => {
        it('should return true when documents are present', () => {
            expect(hasDocuments(mockCompanyProfile)).toBe(true);
        });

        it('should return false when documents array is empty', () => {
            const profileWithoutDocs = { ...mockCompanyProfile, documents: [] };
            expect(hasDocuments(profileWithoutDocs)).toBe(false);
        });

        it('should return false when documents are undefined', () => {
            const profileWithoutDocs = { ...mockCompanyProfile, documents: undefined };
            expect(hasDocuments(profileWithoutDocs)).toBe(false);
        });
    });

    describe('hasQualityMetrics', () => {
        it('should return true when quality score is present', () => {
            expect(hasQualityMetrics(mockCompanyProfile)).toBe(true);
        });

        it('should return true when completion rate is present', () => {
            const profileWithCompletionRate = {
                ...mockCompanyProfile,
                qualityScore: undefined
            };
            expect(hasQualityMetrics(profileWithCompletionRate)).toBe(true);
        });

        it('should return true when average response hours is present', () => {
            const profileWithResponseHours = {
                ...mockCompanyProfile,
                qualityScore: undefined,
                completionRate: undefined
            };
            expect(hasQualityMetrics(profileWithResponseHours)).toBe(true);
        });

        it('should return false when no quality metrics are present', () => {
            const profileWithoutMetrics = {
                ...mockCompanyProfile,
                qualityScore: undefined,
                completionRate: undefined,
                averageResponseHours: undefined
            };
            expect(hasQualityMetrics(profileWithoutMetrics)).toBe(false);
        });
    });

    describe('CompanyDocument interface', () => {
        it('should have correct structure', () => {
            const document: CompanyDocument = {
                id: 'test-doc-id',
                type: 'VERIFICATION',
                name: 'Test Document',
                url: 'https://example.com/doc.pdf',
                uploadedAt: '2024-01-01T00:00:00Z',
                fileSize: 1024,
                contentType: 'application/pdf',
                category: 'Legal Documents'
            };

            expect(document.id).toBe('test-doc-id');
            expect(document.type).toBe('VERIFICATION');
            expect(document.name).toBe('Test Document');
            expect(document.url).toBe('https://example.com/doc.pdf');
            expect(document.uploadedAt).toBe('2024-01-01T00:00:00Z');
            expect(document.fileSize).toBe(1024);
            expect(document.contentType).toBe('application/pdf');
            expect(document.category).toBe('Legal Documents');
        });
    });

    describe('Type compatibility', () => {
        it('should be compatible with legacy fields', () => {
            // Test that the interface supports legacy fields for backward compatibility
            const profileWithLegacyFields: CompanyProfile = {
                ...mockCompanyProfile,
                latitude: 52.5200,
                longitude: 13.4050,
                contactPersonName: 'John Doe'
            };

            expect(profileWithLegacyFields.latitude).toBe(52.5200);
            expect(profileWithLegacyFields.longitude).toBe(13.4050);
            expect(profileWithLegacyFields.contactPersonName).toBe('John Doe');
        });
    });
});