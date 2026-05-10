import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { PastProjectsList } from "../company/PastProjectsList";
import { companyRatingsApiService } from "@/lib/api/company-ratings";
import type { PaginatedProjectReviews } from "@/lib/types/company-ratings";

// Mock the API service
jest.mock("@/lib/api/company-ratings");
const mockApiService = companyRatingsApiService as jest.Mocked<
  typeof companyRatingsApiService
>;

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock data
const mockProjectsData: PaginatedProjectReviews = {
  content: [
    {
      orderId: "order-1",
      projectName: "Website Development",
      completionDate: "2024-01-15T10:00:00Z",
      overallRating: 85,
      companyRole: "PROVIDER",
      status: "COMPLETED",
      reviewerCompanyId: "reviewer-1",
      reviewerCompanyName: "Client Company A",
    },
    {
      orderId: "order-2",
      projectName: "Mobile App Design",
      completionDate: "2024-01-10T14:30:00Z",
      overallRating: 92,
      companyRole: "CLIENT",
      status: "COMPLETED",
      reviewerCompanyId: "reviewer-2",
      reviewerCompanyName: "Service Provider B",
    },
  ],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
};

describe("PastProjectsList", () => {
  const mockOnProjectClick = jest.fn();
  const defaultProps = {
    companyId: "test-company-id",
    onProjectClick: mockOnProjectClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockApiService.getCompanyProjectReviews.mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<PastProjectsList {...defaultProps} />);

    expect(screen.getByText("Vergangene Projekte")).toBeInTheDocument();
    // Check for skeleton loading elements
    expect(screen.getAllByTestId("skeleton")).toHaveLength(5); // 5 skeleton project items
  });

  it("renders projects list successfully", async () => {
    mockApiService.getCompanyProjectReviews.mockResolvedValue(mockProjectsData);

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Website Development")).toBeInTheDocument();
      expect(screen.getByText("Mobile App Design")).toBeInTheDocument();
    });

    // Check project details
    expect(screen.getByText("Dienstleister")).toBeInTheDocument(); // PROVIDER role
    expect(screen.getByText("Auftraggeber")).toBeInTheDocument(); // CLIENT role
    expect(screen.getByText("Client Company A")).toBeInTheDocument();
    expect(screen.getByText("Service Provider B")).toBeInTheDocument();

    // Check ratings
    expect(screen.getByText("4.3")).toBeInTheDocument(); // 85/20 = 4.25 ≈ 4.3
    expect(screen.getByText("4.6")).toBeInTheDocument(); // 92/20 = 4.6
  });

  it("handles project click correctly", async () => {
    mockApiService.getCompanyProjectReviews.mockResolvedValue(mockProjectsData);

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Website Development")).toBeInTheDocument();
    });

    // Click on the first project
    const projectItem = screen.getByText("Website Development").closest("div");
    fireEvent.click(projectItem!);

    expect(mockOnProjectClick).toHaveBeenCalledWith("order-1");
  });

  it("renders empty state when no projects exist", async () => {
    const emptyData: PaginatedProjectReviews = {
      ...mockProjectsData,
      content: [],
      totalElements: 0,
    };

    mockApiService.getCompanyProjectReviews.mockResolvedValue(emptyData);

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Keine Projekte gefunden")).toBeInTheDocument();
      expect(
        screen.getByText(/noch keine abgeschlossenen Projekte/)
      ).toBeInTheDocument();
    });
  });

  it("renders error state and handles retry", async () => {
    const mockError = {
      message: "Network error",
      status: 500,
      code: "NETWORK_ERROR",
    };

    mockApiService.getCompanyProjectReviews.mockRejectedValue(mockError);

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Fehler beim Laden der Projekte")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung."
        )
      ).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText("Erneut versuchen");
    fireEvent.click(retryButton);

    expect(mockApiService.getCompanyProjectReviews).toHaveBeenCalledTimes(2);
  });

  it("handles pagination correctly", async () => {
    const paginatedData: PaginatedProjectReviews = {
      ...mockProjectsData,
      totalPages: 3,
      totalElements: 25,
      first: true,
      last: false,
    };

    mockApiService.getCompanyProjectReviews.mockResolvedValue(paginatedData);

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Zeige 1-2 von 25 Projekten")
      ).toBeInTheDocument();
    });

    // Check pagination buttons
    expect(screen.getByText("Zurück")).toBeDisabled(); // First page
    expect(screen.getByText("Weiter")).toBeEnabled();
    expect(screen.getByText("1")).toHaveClass("bg-primary"); // Current page highlighted
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("handles next page navigation", async () => {
    const firstPageData: PaginatedProjectReviews = {
      ...mockProjectsData,
      page: 0,
      totalPages: 2,
      first: true,
      last: false,
    };

    const secondPageData: PaginatedProjectReviews = {
      ...mockProjectsData,
      page: 1,
      totalPages: 2,
      first: false,
      last: true,
    };

    mockApiService.getCompanyProjectReviews
      .mockResolvedValueOnce(firstPageData)
      .mockResolvedValueOnce(secondPageData);

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Weiter")).toBeInTheDocument();
    });

    // Click next page
    fireEvent.click(screen.getByText("Weiter"));

    await waitFor(() => {
      expect(mockApiService.getCompanyProjectReviews).toHaveBeenCalledWith(
        "test-company-id",
        1, // page 1
        10 // pageSize
      );
    });
  });

  it("validates required props", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <PastProjectsList companyId="" onProjectClick={mockOnProjectClick} />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Fehler beim Laden der Projekte")
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("applies custom className", () => {
    mockApiService.getCompanyProjectReviews.mockImplementation(
      () => new Promise(() => {}) // Keep loading
    );

    const { container } = render(
      <PastProjectsList {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("uses custom page size", async () => {
    mockApiService.getCompanyProjectReviews.mockResolvedValue(mockProjectsData);

    render(<PastProjectsList {...defaultProps} pageSize={5} />);

    await waitFor(() => {
      expect(mockApiService.getCompanyProjectReviews).toHaveBeenCalledWith(
        "test-company-id",
        0,
        5 // Custom page size
      );
    });
  });

  it("displays project without rating correctly", async () => {
    const dataWithNullRating: PaginatedProjectReviews = {
      ...mockProjectsData,
      content: [
        {
          ...mockProjectsData.content[0],
          overallRating: null,
        },
      ],
    };

    mockApiService.getCompanyProjectReviews.mockResolvedValue(
      dataWithNullRating
    );

    render(<PastProjectsList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Keine Bewertung")).toBeInTheDocument();
    });
  });
});
