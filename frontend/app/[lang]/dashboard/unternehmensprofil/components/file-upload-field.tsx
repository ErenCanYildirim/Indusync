"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  /** Unique identifier for the file input */
  id: string;
  /** Field name for form handling */
  name: string;
  /** Label text for the field */
  label: string;
  /** Placeholder text when no file is selected */
  placeholder: string;
  /** Currently selected file */
  file: File | null;
  /** Callback when file is selected */
  onFileChange: (file: File | null) => void;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accepted file types */
  accept?: string;
  /** Error message to display */
  error?: string;
  /** Help text to display below the field */
  helpText?: string;
  /** Callback for validation errors */
  onValidationError?: (error: string) => void;
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeBytes?: number;
}

/**
 * FileUploadField component provides a reusable file upload interface
 * that matches the design pattern used in the registration stepper.
 *
 * Features:
 * - Displays selected file name and size
 * - Supports file validation and error display
 * - Provides clear file removal functionality
 * - Matches existing UI patterns from registration
 * - Accessible with proper labeling
 */
export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  file,
  onFileChange,
  required = false,
  disabled = false,
  className,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  error,
  helpText,
  onValidationError,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
}) => {
  // Handle file selection with enhanced validation
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > maxSizeBytes) {
        const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
        const actualSizeMB = formatFileSize(selectedFile.size);
        const errorMessage = `Datei ist zu groß. Maximale Größe: ${maxSizeMB}MB, aktuelle Größe: ${actualSizeMB}MB`;
        console.error("File too large:", selectedFile.size);
        onValidationError?.(errorMessage);
        return;
      }

      // Validate file type
      const allowedTypes = accept.split(",").map((type) => type.trim());
      const fileExtension =
        "." + selectedFile.name.split(".").pop()?.toLowerCase();
      const mimeType = selectedFile.type;

      const isValidType = allowedTypes.some((allowedType) => {
        if (allowedType.startsWith(".")) {
          return fileExtension === allowedType;
        }
        return mimeType.startsWith(allowedType.replace("*", ""));
      });

      if (!isValidType) {
        const errorMessage = `Ungültiger Dateityp. Erlaubte Formate: ${allowedTypes.join(
          ", "
        )}. Gewählt: ${fileExtension}`;
        console.error("Invalid file type:", selectedFile.type);
        onValidationError?.(errorMessage);
        return;
      }

      // Validate file name length
      if (selectedFile.name.length > 255) {
        const errorMessage = "Dateiname ist zu lang (maximal 255 Zeichen)";
        console.error("File name too long:", selectedFile.name.length);
        onValidationError?.(errorMessage);
        return;
      }

      // Validate that file is not empty
      if (selectedFile.size === 0) {
        const errorMessage = "Datei ist leer oder beschädigt";
        console.error("Empty file:", selectedFile.name);
        onValidationError?.(errorMessage);
        return;
      }

      // File is valid, clear any previous errors and set it
      if (onValidationError) {
        onValidationError(null);
      }
      onFileChange(selectedFile);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = "";
  };

  // Handle file removal
  const handleFileRemove = () => {
    onFileChange(null);
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    document.getElementById(`${id}-file-input`)?.click();
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-foreground flex items-center gap-2">
        <Upload className="h-4 w-4" />
        {label}
        {required && <span className="text-destructive text-xs">*</span>}
      </Label>

      <div className="flex items-center w-full">
        <Input
          id={id}
          name={name}
          type="text"
          readOnly
          placeholder={file ? file.name : placeholder}
          value={file ? file.name : ""}
          className={cn(
            "bg-background text-foreground",
            error && "border-destructive"
          )}
          disabled={disabled}
        />

        {/* Hidden file input */}
        <input
          id={`${id}-file-input`}
          name={`${name}File`}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />

        {/* Browse button */}
        <Button
          type="button"
          variant="outline"
          className="ml-2"
          onClick={handleBrowseClick}
          disabled={disabled}
        >
          Durchsuchen
        </Button>

        {/* Remove file button */}
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-2 text-destructive hover:text-destructive"
            onClick={handleFileRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* File info display */}
      {file && (
        <p className="text-sm text-muted-foreground mt-1">
          Ausgewählte Datei: {file.name} ({formatFileSize(file.size)}MB)
        </p>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}

      {/* Help text */}
      {helpText && !error && (
        <p className="text-sm text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
};

export default FileUploadField;
