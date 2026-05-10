import React from "react";
import { render, screen } from "@testing-library/react";
import { CompanyRoleManagementCard } from "../company-role-management-card";
import { BusinessRole } from "@/lib/types/company-role-management";

// Mock the hooks and dependencies
jest.mock("@/hooks/use-company-roles", () => ({
  useCompanyRoles: jest.fn(() => ({
    currentRoles: { isAuftraggeber: true, isAuftragnehmer: false },
    availableRoles: [BusinessRole.AUFTRAGNEHMER],
    isLoading: false,
    isAddingRole: false,
    error: null,
    canAddRole: jest.fn(() => true),
    clearError: jest.fn(),
  })),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
  useLocale: jest.fn(() => "de"),
}));

const mockCompany = {
  id: "test-company-id",
  name: "Test Company",
  isAuftraggeber: true,
  isAuftragnehmer: false,
};

describe("CompanyRoleManagementCard", () => {
  it("renders without crashing", () => {
    render(<CompanyRoleManagementCard company={mockCompany} />);
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("displays current roles", () => {
    render(<CompanyRoleManagementCard company={mockCompany} />);
    expect(screen.getByText("currentRoles")).toBeInTheDocument();
  });

  it("displays available roles", () => {
    render(<CompanyRoleManagementCard company={mockCompany} />);
    expect(screen.getByText("availableRoles")).toBeInTheDocument();
  });

  it("shows add role button for available roles", () => {
    render(<CompanyRoleManagementCard company={mockCompany} />);
    expect(screen.getByText("addRole")).toBeInTheDocument();
  });
});
