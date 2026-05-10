/**
 * Dashboard Error Boundary Tests
 *
 * Tests for the dashboard-specific error boundary component
 * to ensure proper error handling and translation fallbacks.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  DashboardErrorBoundary,
  DashboardErrorBoundaryWrapper,
} from "../dashboard-error-boundary";

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      "states.error": "Error occurred",
      title: "Dashboard",
      "actions.retry": "Retry",
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => "en"),
}));

// Mock navigation
jest.mock("@/lib/navigation", () => ({
  paths: {
    dashboard: (locale: string) => `/${locale}/dashboard`,
  },
}));

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error("Test error for error boundary");
  }
  return <div>No error</div>;
};

// Component that throws a translation-specific error
const ThrowTranslationError: React.FC = () => {
  throw new Error("useTranslations hook failed");
};

describe("DashboardErrorBoundary", () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when there is no error", () => {
    render(
      <DashboardErrorBoundary>
        <div>Test content</div>
      </DashboardErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should render error fallback when child component throws", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText("Dashboard Error")).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected error occurred/)
    ).toBeInTheDocument();
  });

  it("should render translation-specific error message for translation errors", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowTranslationError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText("Dashboard Error")).toBeInTheDocument();
    expect(
      screen.getByText(/A translation error occurred/)
    ).toBeInTheDocument();
  });

  it("should provide retry functionality", () => {
    const { rerender } = render(
      <DashboardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText("Dashboard Error")).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    // Re-render with no error
    rerender(
      <DashboardErrorBoundary>
        <ThrowError shouldThrow={false} />
      </DashboardErrorBoundary>
    );

    // Should show the content now
    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should provide dashboard navigation link", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    const dashboardLink = screen.getByRole("link");
    expect(dashboardLink).toHaveAttribute("href", "/en/dashboard");
  });

  it("should call onError callback when error occurs", () => {
    const onErrorMock = jest.fn();

    render(
      <DashboardErrorBoundary onError={onErrorMock}>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("should use custom fallback component when provided", () => {
    const CustomFallback: React.FC<{
      error: Error;
      resetError: () => void;
      locale: string;
    }> = ({ error }) => <div>Custom error: {error.message}</div>;

    render(
      <DashboardErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(
      screen.getByText("Custom error: Test error for error boundary")
    ).toBeInTheDocument();
  });

  it("should show error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText("Error Details (Development)")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should hide error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(
      screen.queryByText("Error Details (Development)")
    ).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe("DashboardErrorBoundaryWrapper", () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("should work as a functional component wrapper", () => {
    render(
      <DashboardErrorBoundaryWrapper>
        <div>Wrapped content</div>
      </DashboardErrorBoundaryWrapper>
    );

    expect(screen.getByText("Wrapped content")).toBeInTheDocument();
  });

  it("should handle errors in wrapped components", () => {
    render(
      <DashboardErrorBoundaryWrapper>
        <ThrowError />
      </DashboardErrorBoundaryWrapper>
    );

    expect(screen.getByText("Dashboard Error")).toBeInTheDocument();
  });
});

describe("Translation Fallback in Error Boundary", () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("should handle translation system failure gracefully", () => {
    // Mock translation failure
    const mockUseTranslations = jest.fn(() => {
      throw new Error("Translation system failed");
    });

    jest.doMock("next-intl", () => ({
      useTranslations: mockUseTranslations,
      useLocale: jest.fn(() => "en"),
    }));

    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    // Should still render error boundary with fallback text
    expect(
      screen.getByText(/Dashboard Error|Error occurred/)
    ).toBeInTheDocument();
  });

  it("should use German fallbacks when locale is German", () => {
    jest.doMock("next-intl", () => ({
      useTranslations: jest.fn(() => {
        throw new Error("Translation system failed");
      }),
      useLocale: jest.fn(() => "de"),
    }));

    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    // Should render with German fallbacks
    expect(
      screen.getByText(/Dashboard Fehler|Fehler aufgetreten/)
    ).toBeInTheDocument();
  });
});

describe("Error Boundary Accessibility", () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("should have accessible error message structure", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    // Should have proper heading structure
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();

    // Should have actionable buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);

    // Should have link to dashboard
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("should have proper ARIA labels and roles", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    // Buttons should be accessible
    const retryButton = screen.getByText("Try Again");
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.tagName).toBe("BUTTON");

    // Link should be accessible
    const dashboardLink = screen.getByRole("link");
    expect(dashboardLink).toHaveAttribute("href");
  });
});
