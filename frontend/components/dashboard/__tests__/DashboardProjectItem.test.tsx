/**
 * DashboardProjectItem Component Tests
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardProjectItem } from "../DashboardProjectItem";
import type { DashboardProject } from "@/lib/types/dashboard";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockT = (key: string, params?: any) => {
  const translations: Record<string, string> = {
    assignedTo: "Assigned to",
    notAssigned: "Not assigned",
    clientCompany: "Client",
    unknownClient: "Unknown client",
    projectItemAriaLabel: "Open project: {title}",
    "roleContext.client": "As client",
    "roleContext.provider": "As provider",
  };

  let result = translations[key] || key;
  if (params && result.includes("{")) {
    Object.keys(params).forEach((param) => {
      result = result.replace(`{${param}}`, params[param]);
    });
  }
  return result;
};

const mockTCommon = (key: string, params?: any) => {
  const translations: Record<string, string> = {
    "deadline.overdue": "Overdue",
    "deadline.today": "Today",
    "deadline.tomorrow": "Tomorrow",
    "deadline.daysRemaining": "{days} days remaining",
  };

  let result = translations[key] || key;
  if (params && result.includes("{")) {
    Object.keys(params).forEach((param) => {
      result = result.replace(`{${param}}`, params[param]);
    });
  }
  return result;
};

const mockProject: DashboardProject = {
  id: "1",
  title: "Test Project",
  description: "Test project description",
  status: "PUBLISHED",
  deadline: new Date("2024-12-31"),
  clientCompany: "Test Client",
  providerCompany: "Test Provider",
  roleContext: "client",
};

describe("DashboardProjectItem", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslations as jest.Mock).mockImplementation((namespace) => {
      if (namespace === "Dashboard.projects") return mockT;
      if (namespace === "Common") return mockTCommon;
      return mockT;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders project information correctly", () => {
    render(<DashboardProjectItem project={mockProject} />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Test project description")).toBeInTheDocument();
  });

  it("displays role context correctly for client role", () => {
    render(<DashboardProjectItem project={mockProject} />);

    expect(screen.getByText("As client")).toBeInTheDocument();
  });

  it("displays role context correctly for provider role", () => {
    const providerProject = {
      ...mockProject,
      roleContext: "provider" as const,
    };
    render(<DashboardProjectItem project={providerProject} />);

    expect(screen.getByText("As provider")).toBeInTheDocument();
  });

  it("handles click navigation", () => {
    render(<DashboardProjectItem project={mockProject} />);

    const projectCard = screen.getByRole("button");
    projectCard.click();

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/orders/1");
  });

  it("calls custom onClick handler when provided", () => {
    const mockOnClick = jest.fn();
    render(
      <DashboardProjectItem project={mockProject} onClick={mockOnClick} />
    );

    const projectCard = screen.getByRole("button");
    projectCard.click();

    expect(mockOnClick).toHaveBeenCalledWith("1");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});