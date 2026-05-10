"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  TermsConditionsDocument,
  validateTermsConditionsFile,
  formatFileSize,
  DEFAULT_TC_FILE_VALIDATION,
} from "@/lib/types/terms-conditions";
import { termsConditionsApi } from "@/lib/api/terms-conditions";

interface TermsConditionsUploadSimpleProps {
  onUploadComplete: (document: TermsConditionsDocument) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
  companyId: string;
}

export function TermsConditionsUploadSimple({
  onUploadComplete,
  onUploadError,
  maxFileSize = DEFAULT_TC_FILE_VALIDATION.maxFileSize,
  acceptedTypes = DEFAULT_TC_FILE_VALIDATION.allowedMimeTypes,
  disabled = false,
  className = "",
  companyId,
}: TermsConditionsUploadSimpleProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File) => {
      const validation = validateTermsConditionsFile(file, {
        maxFileSize,
        allowedMimeTypes: acceptedTypes,
        allowedExtensions: [".pdf"],
      });

      setValidationErrors(validation.errors);
      return validation.isValid;
    },
    [maxFileSize, acceptedTypes]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        setValidationErrors([]);
      } else {
        setSelectedFile(null);
      }
    },
    [validateFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      console.log("Uploading T&C document for company:", companyId);

      // Use the termsConditionsApi to upload
      const response = await termsConditionsApi.uploadTermsConditions(
        companyId,
        selectedFile
      );
      console.log("Upload response:", response);

      if (response.successful && response.documentId) {
        // Convert response to TermsConditionsDocument format
        const document: TermsConditionsDocument = {
          id: response.documentId,
          companyId: companyId,
          fileName: response.fileName || selectedFile.name,
          originalFileName: response.originalFileName || selectedFile.name,
          fileSize: response.fileSize || selectedFile.size,
          mimeType: response.mimeType || selectedFile.type,
          url: response.fileUrl || "",
          uploadedAt: response.uploadedAt || new Date().toISOString(),
          uploadedBy: response.uploadedBy || "",
          isActive: response.isActive || true,
          version: response.version || 1,
          checksum: response.checksum || "",
        };

        onUploadComplete(document);

        toast.success("Upload successful", {
          description: `The document '${selectedFile.name}' has been uploaded successfully.`,
        });

        // Reset state
        setSelectedFile(null);
        setValidationErrors([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";

      onUploadError(errorMessage);

      toast.error("Upload error", {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onUploadComplete, onUploadError, companyId]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleBrowseClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Drop Zone */}
      <Card
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-primary/50"
          }
          ${validationErrors.length > 0 ? "border-destructive" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
          {isUploading ? (
            <div className="space-y-4 w-full max-w-xs">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading...</p>
                <p className="text-xs text-muted-foreground">
                  Please wait while your document is being uploaded.
                </p>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4 w-full max-w-sm">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium">File selected</p>
                <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={disabled}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drag and drop file here or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum size: {formatFileSize(maxFileSize)}, Allowed formats:
                  PDF
                </p>
              </div>
              <Button type="button" variant="outline" disabled={disabled}>
                <FileText className="h-4 w-4 mr-2" />
                Browse files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default TermsConditionsUploadSimple;
