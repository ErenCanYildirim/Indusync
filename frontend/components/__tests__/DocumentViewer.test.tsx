import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentViewer } from "../DocumentViewer";
import { CompanyDocument } from "@/lib/api/types";
import { useTranslations } from "next-intl";

// Mock the translations
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

// Mock the toast
jest.mock("@/components/ui/use-toast", () => ({
  toast: jest.fn(),
}));

// Mock the company API
jest.mock("@/lib/api/company", () => ({
  companyApi: {
    getDocumentDownloadUrl: jest.fn(),
  },
}));

const mockTranslations = {
  "actions.close": "Close",
  "actions.download": "Download",
  "actions.downloading": "Downloading...",
  "actions.openInNewTab": "Open in New Tab",
  "actions.retryLoad": "Retry Load",
  loading: "Loading document...",
  previewNotAvailable: "Preview not available for this file type",
  "error.loadFailed": "Failed to load document",
  "error.fileNotFound": "Document not found",
};

const mockDocument: CompanyDocument = {
  id: "test-doc-1",
  type: "VERIFICATION",
  name: "Test Document.pdf",
  url: "https://example.com/test-document.pdf",
  uploadedAt: "2024-01-01T00:00:00Z",
  fileSize: 1024000,
  contentType: "application/pdf",
  category: "Legal Documents",
};

describe("DocumentViewer", () => {
  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(
      (key: string) =>
        mockTranslations[key as keyof typeof mockTranslations] || key
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when document is null", () => {
    render(
      <DocumentViewer document={null} isOpen={false} onClose={jest.fn()} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders document viewer when open with document", async () => {
    render(
      <DocumentViewer
        document={mockDocument}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Document.pdf")).toBeInTheDocument();
    });
  });

  it("shows PDF preview for PDF documents", async () => {
    render(
      <DocumentViewer
        document={mockDocument}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      const iframe = screen.getByTitle("Test Document.pdf");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("src", mockDocument.url);
    });
  });

  it("shows image preview for image documents", async () => {
    const imageDocument: CompanyDocument = {
      ...mockDocument,
      name: "Test Image.jpg",
      contentType: "image/jpeg",
      url: "https://example.com/test-image.jpg",
    };

    render(
      <DocumentViewer
        document={imageDocument}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      const image = screen.getByAltText("Test Image.jpg");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", imageDocument.url);
    });
  });

  it("shows fallback for unsupported file types", async () => {
    const docDocument: CompanyDocument = {
      ...mockDocument,
      name: "Test Document.docx",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    render(
      <DocumentViewer
        document={docDocument}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Preview not available for this file type")
      ).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = jest.fn();

    render(
      <DocumentViewer document={mockDocument} isOpen={true} onClose={onClose} />
    );

    await waitFor(() => {
      const closeButton = screen.getByText("Close");
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles download button click", async () => {
    // Mock createElement and appendChild/removeChild
    const mockLink = {
      href: "",
      download: "",
      target: "",
      click: jest.fn(),
    };
    const mockCreateElement = jest
      .spyOn(document, "createElement")
      .mockReturnValue(mockLink as any);
    const mockAppendChild = jest
      .spyOn(document.body, "appendChild")
      .mockImplementation();
    const mockRemoveChild = jest
      .spyOn(document.body, "removeChild")
      .mockImplementation();

    render(
      <DocumentViewer
        document={mockDocument}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      const downloadButton = screen.getByText("Download");
      fireEvent.click(downloadButton);

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.href).toBe(mockDocument.url);
      expect(mockLink.download).toBe(mockDocument.name);
      expect(mockLink.click).toHaveBeenCalled();
    });

    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });
});
