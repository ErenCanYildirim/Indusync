// Company Profile Integration Test
// This file contains manual test cases for the company profile update functionality

export const testCompanyProfileIntegration = {
    // Test case 1: Basic company information update
    basicInfoUpdate: {
        description: "Update basic company information",
        testData: {
            name: "Test Company GmbH",
            description: "A test company for integration testing",
            businessHours: "Mo-Fr 8:00-17:00",
            website: "https://testcompany.de",
            contactPhone: "+49 123 456789",
            contactEmail: "contact@testcompany.de"
        },
        expectedApiCall: {
            method: "PUT",
            endpoint: "/v1/companies/{companyId}",
            payload: {
                name: "Test Company GmbH",
                description: "A test company for integration testing",
                businessHours: "Mo-Fr 8:00-17:00",
                website: "https://testcompany.de",
                contactPhone: "+49 123 456789",
                contactEmail: "contact@testcompany.de"
            }
        }
    },

    // Test case 2: Address update
    addressUpdate: {
        description: "Update company address information",
        testData: {
            address: {
                street: "Teststraße",
                houseNumber: "123",
                postalCode: "12345",
                city: "Teststadt",
                country: "Deutschland"
            }
        },
        expectedApiCall: {
            method: "PUT",
            endpoint: "/v1/companies/{companyId}",
            payload: {
                address: {
                    street: "Teststraße",
                    houseNumber: "123",
                    postalCode: "12345",
                    city: "Teststadt",
                    country: "Deutschland"
                }
            }
        }
    },

    // Test case 3: Tax information update
    taxInfoUpdate: {
        description: "Update tax information",
        testData: {
            taxInfo: {
                vatNumber: "DE123456789",
                taxId: "123/456/789"
            }
        },
        expectedApiCall: {
            method: "PUT",
            endpoint: "/v1/companies/{companyId}",
            payload: {
                vatNumber: "DE123456789",
                taxId: "123/456/789"
            }
        }
    },

    // Test case 4: Specializations update (Auftragnehmer only)
    specializationsUpdate: {
        description: "Update specializations for Auftragnehmer",
        testData: {
            workRadiusKm: 50,
            specializations: [
                "Elektrotechnik",
                "Automatisierungstechnik",
                "SPS-Programmierung"
            ],
            industries: [
                "Maschinenbau",
                "Automobilindustrie",
                "Anlagenbau"
            ],
            orderCategories: [
                "Neubauprojekt",
                "Wartung",
                "Reparaturen"
            ]
        },
        expectedApiCall: {
            method: "PUT",
            endpoint: "/v1/companies/{companyId}",
            payload: {
                workRadiusKm: 50,
                specializations: [
                    "Elektrotechnik",
                    "Automatisierungstechnik",
                    "SPS-Programmierung"
                ],
                industries: [
                    "Maschinenbau",
                    "Automobilindustrie",
                    "Anlagenbau"
                ],
                orderCategories: [
                    "Neubauprojekt",
                    "Wartung",
                    "Reparaturen"
                ]
            }
        }
    },

    // Test case 5: Complete profile update
    completeProfileUpdate: {
        description: "Update complete company profile",
        testData: {
            name: "Complete Test Company GmbH",
            description: "A comprehensive test company",
            businessHours: "Mo-Fr 7:00-18:00, Sa 8:00-14:00",
            workRadiusKm: 100,
            address: {
                street: "Hauptstraße",
                houseNumber: "1",
                postalCode: "10115",
                city: "Berlin",
                country: "Deutschland"
            },
            contact: {
                phone: "+49 30 12345678",
                email: "info@completetest.de",
                website: "https://completetest.de"
            },
            taxInfo: {
                vatNumber: "DE987654321",
                taxId: "987/654/321"
            },
            specializations: ["Elektrotechnik", "Mechatronik"],
            industries: ["Automobilindustrie"],
            orderCategories: ["Neubauprojekt", "Wartung"]
        },
        expectedApiCall: {
            method: "PUT",
            endpoint: "/v1/companies/{companyId}",
            payload: {
                name: "Complete Test Company GmbH",
                description: "A comprehensive test company",
                businessHours: "Mo-Fr 7:00-18:00, Sa 8:00-14:00",
                workRadiusKm: 100,
                website: "https://completetest.de",
                contactPhone: "+49 30 12345678",
                contactEmail: "info@completetest.de",
                vatNumber: "DE987654321",
                taxId: "987/654/321",
                specializations: ["Elektrotechnik", "Mechatronik"],
                industries: ["Automobilindustrie"],
                orderCategories: ["Neubauprojekt", "Wartung"],
                address: {
                    street: "Hauptstraße",
                    houseNumber: "1",
                    postalCode: "10115",
                    city: "Berlin",
                    country: "Deutschland"
                }
            }
        }
    },

    // Error handling test cases
    errorHandling: {
        // Test case 6: Handle 404 - Company not found
        companyNotFound: {
            description: "Handle 404 error when company not found",
            expectedBehavior: {
                errorMessage: "Unternehmen nicht gefunden.",
                statusCode: 404
            }
        },

        // Test case 7: Handle 403 - Unauthorized access
        unauthorized: {
            description: "Handle 403 error when user lacks permissions",
            expectedBehavior: {
                errorMessage: "Sie haben keine Berechtigung, diese Unternehmensdaten zu ändern.",
                statusCode: 403
            }
        },

        // Test case 8: Handle 400 - Invalid data
        invalidData: {
            description: "Handle 400 error for invalid input data",
            testData: {
                name: "", // Empty name should trigger validation error
                workRadiusKm: -1 // Negative radius should be invalid
            },
            expectedBehavior: {
                errorMessage: "Ungültige Eingabedaten.",
                statusCode: 400
            }
        }
    }
};

// Manual testing checklist
export const manualTestingChecklist = [
    "✅ Load company profile page",
    "✅ Verify all existing data is loaded correctly",
    "✅ Update company name and description",
    "✅ Update address information",
    "✅ Update contact information",
    "✅ Update tax information",
    "✅ Update business hours",
    "✅ Add/remove specializations (Auftragnehmer only)",
    "✅ Add/remove industries (Auftragnehmer only)",
    "✅ Add/remove order categories (Auftragnehmer only)",
    "✅ Update work radius (Auftragnehmer only)",
    "✅ Verify form validation works",
    "✅ Verify success toast appears on successful update",
    "✅ Verify error toast appears on failed update",
    "✅ Test with network errors (disconnect internet)",
    "✅ Test with invalid authentication token",
    "✅ Test with company that user doesn't have access to",
    "✅ Verify UI shows loading states during API calls",
    "✅ Verify data persists after page refresh"
];

// Performance test cases
export const performanceTests = [
    {
        name: "Load time",
        description: "Company profile should load within 2 seconds",
        metric: "< 2s"
    },
    {
        name: "Update response time",
        description: "Profile update should complete within 3 seconds",
        metric: "< 3s"
    },
    {
        name: "Form responsiveness",
        description: "Form inputs should respond immediately to user input",
        metric: "< 100ms"
    }
];

export default testCompanyProfileIntegration; 
