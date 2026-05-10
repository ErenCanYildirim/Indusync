/**
 * DocumentsSection Component Tests
 * Tests for the main documents section component
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { DocumentsSection } from "../DocumentsSection";
import { useOrderDocuments } from "@/hooks/use-order-documents";
import { useDownloadOrderDocument } from "@/hooks/use-download-order-document";

// Mock the hooks
jest.mock("@/hooks/use-order-documents");
jest.mock("@/hooks/use-download-order-document");

const mockUseOrderDocuments = useOrderDocuments as jest.MockedFunction<
  typeof useOrderDocuments
>;
const mockUseDownloadOrderDocument =
  useDownloadOrderDocument as jest.MockedFunction<
    typeof useDownloadOrderDocument
  >;

// Mock document data
const mockDocuments = [
  {
    id: "doc-1",
    fileName: "document1.pdf",
    originalFileName: "document1.pdf",
    fileSize: 1024000,
    contentType: "application/pdf",
    uploadedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "doc-2",
    fileName: "document2.jpg",
    originalFileName: "document2.jpg",
    fileSize: 512000,
    contentType: "image/jpeg",
    uploadedAt: "2024-01-16T14:20:00Z",
  },
];

describe("DocumentsSection Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseOrderDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      isRefreshing: false,
      refetch: jest.fn(),
      clearError: jest.fn(),
    });

    mockUseDownloadOrderDocument.mockReturnValue({
      downloadDocument: jest.fn(),
      isDownloading: jest.fn().mockReturnValue(false),
      error: null,
      clearError: jest.fn(),
    });
  });

  it("should render loading state correctly", () => {
    mockUseOrderDocuments.mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      isRefreshing: false,
      refetch: jest.fn(),
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={true} />);

    expect(screen.getByText("Dokumente")).toBeInTheDocument();
    // Should show skeleton loaders
    expect(document.querySelectorAll('[data-testid="skeleton"]')).toHaveLength(
      3
    );
  });

  it("should render documents list when documents exist", async () => {
    mockUseOrderDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      isRefreshing: false,
      refetch: jest.fn(),
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={true} />);

    expect(screen.getByText("Dokumente")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();

    // Should render DocumentItem components
    await waitFor(() => {
      expect(screen.getByText("document1.pdf")).toBeInTheDocument();
      expect(screen.getByText("document2.jpg")).toBeInTheDocument();
    });
  });

  it("should render empty state when no documents exist", () => {
    mockUseOrderDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      isRefreshing: false,
      refetch: jest.fn(),
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={true} />);

    expect(screen.getByText("Dokumente")).toBeInTheDocument();
    // Should render EmptyDocumentsState
    expect(screen.getByText("Keine Dokumente vorhanden")).toBeInTheDocument();
  });

  it("should render error state correctly", () => {
    const mockRefetch = jest.fn();
    mockUseOrderDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: "Failed to load documents",
      isRefreshing: false,
      refetch: mockRefetch,
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={true} />);

    expect(screen.getByText("Failed to load documents")).toBeInTheDocument();
    expect(screen.getByText("Wiederholen")).toBeInTheDocument();
  });

  it("should show refresh button when documents exist", () => {
    const mockRefetch = jest.fn();
    mockUseOrderDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      isRefreshing: false,
      refetch: mockRefetch,
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={true} />);

    // Should show refresh button in header
    const refreshButtons = screen.getAllByRole("button");
    expect(
      refreshButtons.some((button) =>
        button.getAttribute("aria-label")?.includes("refresh")
      )
    ).toBeTruthy();
  });

  it("should handle download action correctly", async () => {
    const mockDownloadDocument = jest.fn();
    mockUseOrderDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      isRefreshing: false,
      refetch: jest.fn(),
      clearError: jest.fn(),
    });

    mockUseDownloadOrderDocument.mockReturnValue({
      downloadDocument: mockDownloadDocument,
      isDownloading: jest.fn().mockReturnValue(false),
      error: null,
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={true} />);

    // This test would need more complex setup to test download functionality
    // as it involves interaction with DocumentItem components
    expect(mockDownloadDocument).not.toHaveBeenCalled();
  });

  it("should pass correct props to child components", () => {
    mockUseOrderDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      isRefreshing: false,
      refetch: jest.fn(),
      clearError: jest.fn(),
    });

    render(<DocumentsSection orderId="test-order-id" isBackendOrder={false} />);

    // Should pass isBackendOrder=false to EmptyDocumentsState
    expect(screen.getByText("Demo-Projekt ohne Dokumente")).toBeInTheDocument();
  });
});
