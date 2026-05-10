/**
 * DashboardProjectList Component Tests
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { DashboardProjectList } from "../DashboardProjectList";
import type { DashboardProject } from "@/lib/types/dashboard";

// Mock dependencies
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

jest.mock("../DashboardProjectItem", () => ({
  DashboardProjectItem: ({ project }: { project: DashboardProject }) => (
    <div data-testid={`project-${project.id}`}>{project.title}</div>
  ),
}));

const mockT = (key: string, params?: any) => {
  const translations: Record<string, string> = {
    "empty.title": "No active projects",
    "empty.description": "You currently have no active projects.",
    "error.loadingFailed": "Failed to load projects",
    "error.retry": "Retry",
    showingCount: "Showing {count} of {total} projects",
  };

  let result = translations[key] || key;
  if (params && result.includes("{")) {
    Object.keys(params).forEach((param) => {
      result = result.replace(`{${param}}`, params[param]);
    });
  }
  return result;
};

const mockProjects: DashboardProject[] = [
  {
    id: "1",
    title: "Project 1",
    description: "Description 1",
    status: "PUBLISHED",
    roleContext: "client",
  },
  {
    id: "2",
    title: "Project 2",
    description: "Description 2",
    status: "ASSIGNED",
    roleContext: "provider",
  },
];

describe("DashboardProjectList", () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeletons when loading", () => {
    render(
      <DashboardProjectList
        projects={[]}
        isLoading={true}
        onRetry={mockOnRetry}
      />
    );

    // Should render skeleton elements
    const skeletons = screen.getAllByTestId(/skeleton-/);
    expect(skeletons).toHaveLength(3);
  });

  it("renders error state with retry button", () => {
    render(
      <DashboardProjectList
        projects={[]}
        isLoading={false}
        error="Network error"
        onRetry={mockOnRetry}
      />
    );

    expect(
      screen.getByText("Failed to load projects: Network error")
    ).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders empty state when no projects", () => {
    render(
      <DashboardProjectList
        projects={[]}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText("No active projects")).toBeInTheDocument();
    expect(
      screen.getByText("You currently have no active projects.")
    ).toBeInTheDocument();
  });

  it("renders project list when projects are available", () => {
    render(
      <DashboardProjectList
        projects={mockProjects}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByTestId("project-1")).toBeInTheDocument();
    expect(screen.getByTestId("project-2")).toBeInTheDocument();
    expect(screen.getByText("Showing 2 of 2 projects")).toBeInTheDocument();
  });

  it("calls retry function when retry button is clicked", () => {
    render(
      <DashboardProjectList
        projects={[]}
        isLoading={false}
        error="Network error"
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByText("Retry");
    retryButton.click();

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});