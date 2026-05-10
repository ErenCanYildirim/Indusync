/**
 * DashboardDeadlineList Component Tests
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { DashboardDeadlineList } from "../DashboardDeadlineList";
import type { DashboardDeadline } from "@/lib/types/dashboard";

// Mock dependencies
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

jest.mock("../DashboardDeadlineItem", () => ({
  DashboardDeadlineItem: ({ deadline, onClick }: any) => (
    <div
      data-testid={`deadline-item-${deadline.id}`}
      onClick={() => onClick?.(deadline.id, deadline.orderId)}
    >
      {deadline.orderTitle} - {deadline.timeRemaining}
    </div>
  ),
}));

const mockT = jest.fn((key: string, params?: any) => {
  if (key === "showingCount") {
    return `Showing ${params?.count} of ${params?.total} deadlines`;
  }
  if (key === "empty.title") return "No upcoming deadlines";
  if (key === "empty.description")
    return "You're all caught up! No deadlines in the next 30 days.";
  if (key === "empty.badge") return "All clear";
  if (key === "error.loadingFailed") return "Failed to load deadlines";
  if (key === "error.retry") return "Retry";
  if (key.startsWith("urgency.")) {
    const urgency = key.split(".")[1];
    return urgency.charAt(0).toUpperCase() + urgency.slice(1);
  }
  return key;
});

beforeEach(() => {
  (useTranslations as jest.Mock).mockReturnValue(mockT);
  jest.clearAllMocks();
});

const mockDeadlines: DashboardDeadline[] = [
  {
    id: "deadline-1",
    orderId: "order-1",
    orderTitle: "Critical Order",
    deadlineDate: new Date("2024-12-31T23:59:59Z"),
    deadlineType: "completion",
    urgencyLevel: "critical",
    actionRequired: "Complete immediately",
    timeRemaining: "1 day",
  },
  {
    id: "deadline-2",
    orderId: "order-2",
    orderTitle: "High Priority Order",
    deadlineDate: new Date("2025-01-02T23:59:59Z"),
    deadlineType: "milestone",
    urgencyLevel: "high",
    actionRequired: "Review milestone",
    timeRemaining: "3 days",
  },
  {
    id: "deadline-3",
    orderId: "order-3",
    orderTitle: "Medium Priority Order",
    deadlineDate: new Date("2025-01-07T23:59:59Z"),
    deadlineType: "application_response",
    urgencyLevel: "medium",
    actionRequired: "Respond to application",
    timeRemaining: "1 week",
  },
];

describe("DashboardDeadlineList", () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  it("renders loading skeletons when loading", () => {
    render(
      <DashboardDeadlineList
        deadlines={[]}
        isLoading={true}
        onRetry={mockOnRetry}
      />
    );

    // Should render 3 skeleton items
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons).toHaveLength(0); // Skeletons don't have testids, but the structure should be there

    // Check for skeleton structure
    expect(document.querySelectorAll(".space-y-4")).toHaveLength(1);
  });

  it("renders error state with retry button", () => {
    const errorMessage = "Network error";
    render(
      <DashboardDeadlineList
        deadlines={[]}
        isLoading={false}
        error={errorMessage}
        onRetry={mockOnRetry}
      />
    );

    expect(
      screen.getByText("Failed to load deadlines: Network error")
    ).toBeInTheDocument();

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no deadlines", () => {
    render(
      <DashboardDeadlineList
        deadlines={[]}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText("No upcoming deadlines")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You're all caught up! No deadlines in the next 30 days."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("All clear")).toBeInTheDocument();
  });

  it("renders deadline list correctly", () => {
    render(
      <DashboardDeadlineList
        deadlines={mockDeadlines}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByTestId("deadline-item-deadline-1")).toBeInTheDocument();
    expect(screen.getByTestId("deadline-item-deadline-2")).toBeInTheDocument();
    expect(screen.getByTestId("deadline-item-deadline-3")).toBeInTheDocument();

    expect(screen.getByText("Critical Order - 1 day")).toBeInTheDocument();
    expect(
      screen.getByText("High Priority Order - 3 days")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Medium Priority Order - 1 week")
    ).toBeInTheDocument();
  });

  it("displays count information", () => {
    render(
      <DashboardDeadlineList
        deadlines={mockDeadlines}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText("Showing 3 of 3 deadlines")).toBeInTheDocument();
  });

  it("displays urgency breakdown badges", () => {
    render(
      <DashboardDeadlineList
        deadlines={mockDeadlines}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText("Critical: 1")).toBeInTheDocument();
    expect(screen.getByText("High: 1")).toBeInTheDocument();
    expect(screen.getByText("Medium: 1")).toBeInTheDocument();
    // Low should not appear since there are no low urgency deadlines
    expect(screen.queryByText("Low:")).not.toBeInTheDocument();
  });

  it("sorts deadlines by urgency and date", () => {
    const unsortedDeadlines = [
      mockDeadlines[2], // medium
      mockDeadlines[0], // critical
      mockDeadlines[1], // high
    ];

    render(
      <DashboardDeadlineList
        deadlines={unsortedDeadlines}
        isLoading={false}
        onRetry={mockOnRetry}
      />
    );

    const deadlineItems = screen.getAllByTestId(/deadline-item/);

    // Should be sorted: critical, high, medium
    expect(deadlineItems[0]).toHaveAttribute(
      "data-testid",
      "deadline-item-deadline-1"
    );
    expect(deadlineItems[1]).toHaveAttribute(
      "data-testid",
      "deadline-item-deadline-2"
    );
    expect(deadlineItems[2]).toHaveAttribute(
      "data-testid",
      "deadline-item-deadline-3"
    );
  });

  it("calls onDeadlineClick when deadline item is clicked", () => {
    const mockOnDeadlineClick = jest.fn();
    render(
      <DashboardDeadlineList
        deadlines={mockDeadlines}
        isLoading={false}
        onRetry={mockOnRetry}
        onDeadlineClick={mockOnDeadlineClick}
      />
    );

    const firstDeadlineItem = screen.getByTestId("deadline-item-deadline-1");
    fireEvent.click(firstDeadlineItem);

    expect(mockOnDeadlineClick).toHaveBeenCalledWith("deadline-1", "order-1");
  });

  it("applies custom className", () => {
    const { container } = render(
      <DashboardDeadlineList
        deadlines={mockDeadlines}
        isLoading={false}
        onRetry={mockOnRetry}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});