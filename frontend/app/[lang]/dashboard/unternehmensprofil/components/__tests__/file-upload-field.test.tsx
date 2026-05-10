/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileUploadField } from "../file-upload-field";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "fileUpload.browse": "Browse",
      "fileUpload.selectedFile": "Selected file: {name} ({size} MB)",
    };
    return translations[key] || key;
  },
}));

describe("FileUploadField", () => {
  const defaultProps = {
    id: "test-upload",
    name: "testFile",
    label: "Test File Upload",
    placeholder: "Select a file...",
    file: null,
    onFileChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<FileUploadField {...defaultProps} />);

    expect(screen.getByLabelText("Test File Upload")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select a file...")).toBeInTheDocument();
    expect(screen.getByText("Browse")).toBeInTheDocument();
  });

  it("displays selected file information when file is provided", () => {
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const props = { ...defaultProps, file: mockFile };

    render(<FileUploadField {...props} />);

    expect(screen.getByDisplayValue("test.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Selected file: test.pdf/)).toBeInTheDocument();
  });

  it("shows remove button when file is selected", () => {
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const props = { ...defaultProps, file: mockFile };

    render(<FileUploadField {...props} />);

    const removeButton = screen.getByRole("button", { name: "" }); // X button has no text
    expect(removeButton).toBeInTheDocument();
  });

  it("calls onFileChange when file is removed", () => {
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const mockOnFileChange = jest.fn();
    const props = {
      ...defaultProps,
      file: mockFile,
      onFileChange: mockOnFileChange,
    };

    render(<FileUploadField {...props} />);

    const removeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(removeButton);

    expect(mockOnFileChange).toHaveBeenCalledWith(null);
  });

  it("displays error message when error prop is provided", () => {
    const props = { ...defaultProps, error: "File is too large" };

    render(<FileUploadField {...props} />);

    expect(screen.getByText("File is too large")).toBeInTheDocument();
  });

  it("displays help text when helpText prop is provided", () => {
    const props = {
      ...defaultProps,
      helpText: "Upload PDF, DOC, or image files",
    };

    render(<FileUploadField {...props} />);

    expect(
      screen.getByText("Upload PDF, DOC, or image files")
    ).toBeInTheDocument();
  });

  it("shows required indicator when required prop is true", () => {
    const props = { ...defaultProps, required: true };

    render(<FileUploadField {...props} />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("disables input and buttons when disabled prop is true", () => {
    const props = { ...defaultProps, disabled: true };

    render(<FileUploadField {...props} />);

    const input = screen.getByDisplayValue("");
    const browseButton = screen.getByText("Browse");

    expect(input).toBeDisabled();
    expect(browseButton).toBeDisabled();
  });
});
