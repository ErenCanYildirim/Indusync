/**
 * DashboardDeadlineItem Component Tests
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardDeadlineItem } from "../DashboardDeadlineItem";
import type { DashboardDeadline } from "@/lib/types/dashboard";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

const mockPush = jest.fn();
const mockT = jest.fn((key: string, params?: any) => {
  if (key === "deadlineItemAriaLabel") {
    return `Deadline for ${params?.title}, ${params?.timeRemaining} remaining`;
  }
  if (key.startsWith("type.")) {
    const type = key.split(".")[1];
    return type === "completion"
      ? "Order Completion"
      : type === "milestone"
      ? "Milestone"
      : type === "applicationResponse"
      ? "Application Response"
      : "General";
  }
  return key;
});

const mockTCommon = jest.fn((key: string) => key);

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  });
  (useTranslations as jest.Mock).mockImplementation((namespace: string) => {
    return namespace === "Common" ? mockTCommon : mockT;
  });
  jest.clearAllMocks();
});

const mockDeadline: DashboardDeadline = {
  id: "deadline-1",
  orderId: "order-1",
  orderTitle: "Test Order Title",
  deadlineDate: new Date("2024-12-31T23:59:59Z"),
  deadlineType: "completion",
  urgencyLevel: "high",
  actionRequired: "Complete the order by the deadline",
  timeRemaining: "2 days",
};

describe("DashboardDeadlineItem", () => {
  it("renders deadline information correctly", () => {
    render(<DashboardDeadlineItem deadline={mockDeadline} />);

    expect(screen.getByText("Test Order Title")).toBeInTheDocument();
    expect(screen.getByText("2 days")).toBeInTheDocument();
    expect(
      screen.getByText("Complete the order by the deadline")
    ).toBeInTheDocument();
    expect(screen.getByText("Order Completion")).toBeInTheDocument();
  });

  it("applies correct urgency styling for high urgency", () => {
    render(<DashboardDeadlineItem deadline={mockDeadline} />);

    const card = screen.getByRole("button");
    expect(card).toHaveClass("border-orange-200");
  });

  it("applies correct urgency styling for critical urgency", () => {
    const criticalDeadline = {
      ...mockDeadline,
      urgencyLevel: "critical" as const,
    };
    render(<DashboardDeadlineItem deadline={criticalDeadline} />);

    const card = screen.getByRole("button");
    expect(card).toHaveClass("border-red-200");
  });

  it("navigates to order detail on click for completion deadline", () => {
    render(<DashboardDeadlineItem deadline={mockDeadline} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/orders/order-1");
  });

  it("navigates to milestones section for milestone deadline", () => {
    const milestoneDeadline = {
      ...mockDeadline,
      deadlineType: "milestone" as const,
    };
    render(<DashboardDeadlineItem deadline={milestoneDeadline} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/orders/order-1#milestones"
    );
  });

  it("navigates to applications page for application response deadline", () => {
    const applicationDeadline = {
      ...mockDeadline,
      deadlineType: "application_response" as const,
    };
    render(<DashboardDeadlineItem deadline={applicationDeadline} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/orders/order-1/applications"
    );
  });

  it("calls custom onClick handler when provided", () => {
    const mockOnClick = jest.fn();
    render(
      <DashboardDeadlineItem deadline={mockDeadline} onClick={mockOnClick} />
    );

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith("deadline-1", "order-1");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handles keyboard navigation", () => {
    render(<DashboardDeadlineItem deadline={mockDeadline} />);

    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/orders/order-1");
  });

  it("has proper accessibility attributes", () => {
    render(<DashboardDeadlineItem deadline={mockDeadline} />);

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("tabIndex", "0");
    expect(card).toHaveAttribute(
      "aria-label",
      "Deadline for Test Order Title, 2 days remaining"
    );
  });

  it("displays different deadline types correctly", () => {
    const { rerender } = render(
      <DashboardDeadlineItem deadline={mockDeadline} />
    );
    expect(screen.getByText("Order Completion")).toBeInTheDocument();

    const milestoneDeadline = {
      ...mockDeadline,
      deadlineType: "milestone" as const,
    };
    rerender(<DashboardDeadlineItem deadline={milestoneDeadline} />);
    expect(screen.getByText("Milestone")).toBeInTheDocument();

    const applicationDeadline = {
      ...mockDeadline,
      deadlineType: "application_response" as const,
    };
    rerender(<DashboardDeadlineItem deadline={applicationDeadline} />);
    expect(screen.getByText("Application Response")).toBeInTheDocument();
  });
});