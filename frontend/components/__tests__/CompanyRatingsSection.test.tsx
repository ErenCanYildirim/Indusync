import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompanyRatingsSection } from "../company/CompanyRatingsSection";
import { companyRatingsApiService } from "@/lib/api/company-ratings";
import { useTranslations } from "next-intl";
import type { CompanyRatingsSummary } from "@/lib/types/company-ratings";

// Mock the translations
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

// Mock the company ratings API service
jest.mock("@/lib/api/company-ratings", () => ({
  companyRatingsApiService: {
    getCompanyRatingsSummary: jest.fn(),
  },
}));

const mockTranslations = (key: string) => {
  const translations: Record<string, string> = {
    "actions.retry": "Retry",
    loading: "Loading...",
    error: "Error",
  };
  return translations[key] || key;
};

const mockRatingsData: CompanyRatingsSummary = {
  companyId: "test-company-id",
  overallRating: 85.5,
  totalReviews: 15,
  completedOrders: 12,
  categoryRatings: {
    COMMUNICATION: {
      category: "COMMUNICATION",
      averageScore: 88.0,
      reviewCount: 15,
      qualityLevel: "Sehr gut",
    },
    RESPONSE_TIME: {
      category: "RESPONSE_TIME",
      averageScore: 82.5,
      reviewCount: 14,
      qualityLevel: "Sehr gut",
    },
    PUNCTUALITY: {
      category: "PUNCTUALITY",
      averageScore: 90.0,
      reviewCount: 13,
      qualityLevel: "Exzellent",
    },
    QUALITY: {
      category: "QUALITY",
      averageScore: 87.5,
      reviewCount: 15,
      qualityLevel: "Sehr gut",
    },
    BUDGET: {
      category: "BUDGET",
      averageScore: 85.0,
      reviewCount: 12,
      qualityLevel: "Sehr gut",
    },
    FLEXIBILITY: {
      category: "FLEXIBILITY",
      averageScore: 83.0,
      reviewCount: 11,
      qualityLevel: "Sehr gut",
    },
    DOCUMENTATION: {
      category: "DOCUMENTATION",
      averageScore: 80.0,
      reviewCount: 10,
      qualityLevel: "Gut",
    },
    OVERALL_SATISFACTION: {
      category: "OVERALL_SATISFACTION",
      averageScore: 86.0,
      reviewCount: 15,
      qualityLevel: "Sehr gut",
    },
  },
  recentProjects: [
    {
      orderId: "order-1",
      projectName: "Website Development",
      completionDate: "2024-01-15T10:00:00Z",
      overallRating: 90.0,
      companyRole: "PROVIDER",
      status: "COMPLETED",
      reviewerCompanyId: "reviewer-1",
      reviewerCompanyName: "Test Client Company",
    },
    {
      orderId: "order-2",
      projectName: "Mobile App Design",
      completionDate: "2024-01-10T14:30:00Z",
      overallRating: 85.0,
      companyRole: "CLIENT",
      status: "COMPLETED",
      reviewerCompanyId: "reviewer-2",
      reviewerCompanyName: "Test Provider Company",
    },
  ],
};

describe("CompanyRatingsSection", () => {
  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(mockTranslations);
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<CompanyRatingsSection companyId="test-company-id" />);

    // Check for skeleton loading elements by class name
    const skeletonElements = document.querySelectorAll(".animate-pulse");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders ratings data successfully", async () => {
    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockResolvedValue(mockRatingsData);

    render(<CompanyRatingsSection companyId="test-company-id" />);

    await waitFor(() => {
      expect(screen.getByText("Bewertungen & Rezensionen")).toBeInTheDocument();
    });

    // Check overall rating display
    expect(screen.getByText("4.3")).toBeInTheDocument(); // 85.5 / 20 = 4.275 ≈ 4.3
    expect(screen.getByText("15 Bewertungen")).toBeInTheDocument();
    expect(screen.getByText("12 abgeschlossene Projekte")).toBeInTheDocument();

    // Check category ratings
    expect(screen.getByText("Kommunikation")).toBeInTheDocument();
    expect(screen.getByText("Pünktlichkeit")).toBeInTheDocument();
    expect(screen.getByText("Arbeitsqualität")).toBeInTheDocument();

    // Check recent projects
    expect(screen.getByText("Website Development")).toBeInTheDocument();
    expect(screen.getByText("Mobile App Design")).toBeInTheDocument();
    expect(screen.getByText("Dienstleister")).toBeInTheDocument();
    expect(screen.getByText("Auftraggeber")).toBeInTheDocument();
  });

  it("renders empty state when no reviews exist", async () => {
    const emptyData: CompanyRatingsSummary = {
      ...mockRatingsData,
      totalReviews: 0,
      overallRating: null,
      recentProjects: [],
    };

    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockResolvedValue(emptyData);

    render(<CompanyRatingsSection companyId="test-company-id" />);

    await waitFor(() => {
      expect(screen.getByText("Noch keine Bewertungen")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Dieses Unternehmen hat noch keine Bewertungen erhalten/)
    ).toBeInTheDocument();
  });

  it("renders error state and allows retry", async () => {
    const mockError = {
      message: "Network error",
      status: 500,
      code: "NETWORK_ERROR",
    };

    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockRejectedValue(mockError);

    render(<CompanyRatingsSection companyId="test-company-id" />);

    await waitFor(() => {
      expect(
        screen.getByText("Fehler beim Laden der Bewertungen")
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Netzwerkfehler/)).toBeInTheDocument();

    const retryButton = screen.getByText("Erneut versuchen");
    expect(retryButton).toBeInTheDocument();

    // Test retry functionality
    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockResolvedValue(mockRatingsData);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Bewertungen & Rezensionen")).toBeInTheDocument();
    });
  });

  it("handles project click callback", async () => {
    const mockOnProjectClick = jest.fn();
    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockResolvedValue(mockRatingsData);

    render(
      <CompanyRatingsSection
        companyId="test-company-id"
        onProjectClick={mockOnProjectClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Website Development")).toBeInTheDocument();
    });

    // Find the project item by looking for the clickable container
    const projectItem = screen
      .getByText("Website Development")
      .closest(".cursor-pointer");
    if (projectItem) {
      fireEvent.click(projectItem);
      expect(mockOnProjectClick).toHaveBeenCalledWith("order-1");
    } else {
      // Fallback: click on the text element itself
      fireEvent.click(screen.getByText("Website Development"));
      expect(mockOnProjectClick).toHaveBeenCalledWith("order-1");
    }
  });

  it("handles invalid company ID", async () => {
    render(<CompanyRatingsSection companyId="" />);

    await waitFor(() => {
      expect(
        screen.getByText("Fehler beim Laden der Bewertungen")
      ).toBeInTheDocument();
    });
  });

  it("displays quality levels correctly", async () => {
    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockResolvedValue(mockRatingsData);

    render(<CompanyRatingsSection companyId="test-company-id" />);

    await waitFor(() => {
      expect(screen.getByText("Sehr gut")).toBeInTheDocument(); // Overall rating quality level
    });

    // Check category quality levels
    expect(screen.getAllByText("Sehr gut").length).toBeGreaterThan(1);
    expect(screen.getByText("Exzellent")).toBeInTheDocument();
    expect(screen.getByText("Gut")).toBeInTheDocument();
  });

  it("formats dates correctly", async () => {
    (
      companyRatingsApiService.getCompanyRatingsSummary as jest.Mock
    ).mockResolvedValue(mockRatingsData);

    render(<CompanyRatingsSection companyId="test-company-id" />);

    await waitFor(() => {
      // Check German date format (DD.MM.YYYY)
      expect(screen.getByText("15.01.2024")).toBeInTheDocument();
      expect(screen.getByText("10.01.2024")).toBeInTheDocument();
    });
  });
});
