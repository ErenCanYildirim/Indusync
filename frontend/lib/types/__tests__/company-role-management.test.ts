import { describe, it, expect } from '@jest/globals';
import {
    BusinessRole,
    CompanyRoles,
    RoleRequirements,
    AddBusinessRoleSchema,
    AddBusinessRoleData,
    BusinessRoleUtils,
    isBusinessRole,
    parseBusinessRole,
} from '../company-role-management';

describe('BusinessRole', () => {
    it('should have correct enum values matching backend', () => {
        expect(BusinessRole.AUFTRAGGEBER).toBe('AUFTRAGGEBER');
        expect(BusinessRole.AUFTRAGNEHMER).toBe('AUFTRAGNEHMER');
    });
});

describe('CompanyRoles interface', () => {
    it('should accept valid company roles object', () => {
        const roles: CompanyRoles = {
            isAuftraggeber: true,
            isAuftragnehmer: false,
        };

        expect(roles.isAuftraggeber).toBe(true);
        expect(roles.isAuftragnehmer).toBe(false);
    });
});

describe('RoleRequirements interface', () => {
    it('should accept valid role requirements object', () => {
        const requirements: RoleRequirements = {
            role: BusinessRole.AUFTRAGNEHMER,
            requiredFields: ['specializations', 'industries'],
            optionalFields: ['certifications'],
            description: 'Test description',
            followsRegistrationFlow: true,
        };

        expect(requirements.role).toBe(BusinessRole.AUFTRAGNEHMER);
        expect(requirements.requiredFields).toContain('specializations');
    });
});

describe('AddBusinessRoleSchema', () => {
    it('should validate Auftraggeber role addition with minimal data', () => {
        const data = {
            role: BusinessRole.AUFTRAGGEBER,
        };

        const result = AddBusinessRoleSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('should require additional fields for Auftragnehmer role', () => {
        const data = {
            role: BusinessRole.AUFTRAGNEHMER,
        };

        const result = AddBusinessRoleSchema.safeParse(data);
        expect(result.success).toBe(false);

        if (!result.success) {
            const errors = result.error.issues.map(issue => issue.path[0]);
            expect(errors).toContain('specializations');
            expect(errors).toContain('industries');
            expect(errors).toContain('workRadiusKm');
            expect(errors).toContain('description');
        }
    });

    it('should validate complete Auftragnehmer role data', () => {
        const data = {
            role: BusinessRole.AUFTRAGNEHMER,
            specializations: ['Software Development'],
            industries: ['Technology'],
            workRadiusKm: 50,
            description: 'We provide excellent software development services',
            contactPersonName: 'John Doe',
            contactPersonEmail: 'john@example.com',
        };

        const result = AddBusinessRoleSchema.safeParse(data);
        expect(result.success).toBe(true);
    });
});

describe('BusinessRoleUtils', () => {
    describe('getDisplayName', () => {
        it('should return correct German display names', () => {
            expect(BusinessRoleUtils.getDisplayName(BusinessRole.AUFTRAGGEBER)).toBe('Auftraggeber');
            expect(BusinessRoleUtils.getDisplayName(BusinessRole.AUFTRAGNEHMER)).toBe('Auftragnehmer');
        });
    });

    describe('getRoleDescription', () => {
        it('should return correct role descriptions', () => {
            const agDescription = BusinessRoleUtils.getRoleDescription(BusinessRole.AUFTRAGGEBER);
            const anDescription = BusinessRoleUtils.getRoleDescription(BusinessRole.AUFTRAGNEHMER);

            expect(agDescription).toContain('Erstellen von Aufträgen');
            expect(anDescription).toContain('Anbieten von Dienstleistungen');
        });
    });

    describe('requiresSpecializationData', () => {
        it('should return false for Auftraggeber', () => {
            expect(BusinessRoleUtils.requiresSpecializationData(BusinessRole.AUFTRAGGEBER)).toBe(false);
        });

        it('should return true for Auftragnehmer', () => {
            expect(BusinessRoleUtils.requiresSpecializationData(BusinessRole.AUFTRAGNEHMER)).toBe(true);
        });
    });

    describe('getAvailableRoles', () => {
        it('should return both roles for company with no roles', () => {
            const currentRoles: CompanyRoles = {
                isAuftraggeber: false,
                isAuftragnehmer: false,
            };

            const available = BusinessRoleUtils.getAvailableRoles(currentRoles);
            expect(available).toContain(BusinessRole.AUFTRAGGEBER);
            expect(available).toContain(BusinessRole.AUFTRAGNEHMER);
        });

        it('should return only Auftragnehmer for AG-only company', () => {
            const currentRoles: CompanyRoles = {
                isAuftraggeber: true,
                isAuftragnehmer: false,
            };

            const available = BusinessRoleUtils.getAvailableRoles(currentRoles);
            expect(available).not.toContain(BusinessRole.AUFTRAGGEBER);
            expect(available).toContain(BusinessRole.AUFTRAGNEHMER);
        });

        it('should return empty array for company with both roles', () => {
            const currentRoles: CompanyRoles = {
                isAuftraggeber: true,
                isAuftragnehmer: true,
            };

            const available = BusinessRoleUtils.getAvailableRoles(currentRoles);
            expect(available).toHaveLength(0);
        });
    });

    describe('canAddRole', () => {
        it('should allow adding Auftragnehmer to AG-only company', () => {
            const currentRoles: CompanyRoles = {
                isAuftraggeber: true,
                isAuftragnehmer: false,
            };

            expect(BusinessRoleUtils.canAddRole(currentRoles, BusinessRole.AUFTRAGNEHMER)).toBe(true);
            expect(BusinessRoleUtils.canAddRole(currentRoles, BusinessRole.AUFTRAGGEBER)).toBe(false);
        });
    });

    describe('getRoleRequirements', () => {
        it('should return correct requirements for Auftraggeber', () => {
            const requirements = BusinessRoleUtils.getRoleRequirements(BusinessRole.AUFTRAGGEBER);

            expect(requirements.role).toBe(BusinessRole.AUFTRAGGEBER);
            expect(requirements.requiredFields).toHaveLength(0);
            expect(requirements.followsRegistrationFlow).toBe(false);
        });

        it('should return correct requirements for Auftragnehmer', () => {
            const requirements = BusinessRoleUtils.getRoleRequirements(BusinessRole.AUFTRAGNEHMER);

            expect(requirements.role).toBe(BusinessRole.AUFTRAGNEHMER);
            expect(requirements.requiredFields).toContain('specializations');
            expect(requirements.requiredFields).toContain('industries');
            expect(requirements.followsRegistrationFlow).toBe(true);
        });
    });
});

describe('Type guards and parsers', () => {
    describe('isBusinessRole', () => {
        it('should return true for valid business roles', () => {
            expect(isBusinessRole('AUFTRAGGEBER')).toBe(true);
            expect(isBusinessRole('AUFTRAGNEHMER')).toBe(true);
        });

        it('should return false for invalid values', () => {
            expect(isBusinessRole('INVALID')).toBe(false);
            expect(isBusinessRole('')).toBe(false);
            expect(isBusinessRole('auftraggeber')).toBe(false);
        });
    });

    describe('parseBusinessRole', () => {
        it('should parse valid business role strings', () => {
            expect(parseBusinessRole('AUFTRAGGEBER')).toBe(BusinessRole.AUFTRAGGEBER);
            expect(parseBusinessRole('AUFTRAGNEHMER')).toBe(BusinessRole.AUFTRAGNEHMER);
        });

        it('should throw error for invalid values', () => {
            expect(() => parseBusinessRole('INVALID')).toThrow('Invalid business role: INVALID');
            expect(() => parseBusinessRole('')).toThrow('Invalid business role: ');
        });
    });
});