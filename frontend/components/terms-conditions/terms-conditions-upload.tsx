"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  TermsConditionsDocument,
  validateTermsConditionsFile,
  formatFileSize,
  DEFAULT_TC_FILE_VALIDATION,
} from "@/lib/types/terms-conditions";
import {
  validateTermsConditionsFileSecurity,
  validateTermsConditionsFileQuick,
  formatSecurityErrors,
  FileSecurityError,
  SecurityErrorCodes,
  type SecurityValidationResult,
} from "@/lib/utils/file-validation";

interface TermsConditionsUploadProps {
  onUploadComplete: (document: TermsConditionsDocument) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

export function TermsConditionsUpload({
  onUploadComplete,
  onUploadError,
  maxFileSize = DEFAULT_TC_FILE_VALIDATION.maxFileSize,
  acceptedTypes = DEFAULT_TC_FILE_VALIDATION.allowedMimeTypes,
  disabled = false,
  className = "",
}: TermsConditionsUploadProps) {
  const t = useTranslations("termsConditions");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [securityValidation, setSecurityValidation] =
    useState<SecurityValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileQuick = useCallback(
    (file: File) => {
      const validation = validateTermsConditionsFileQuick(file, {
        maxFileSize,
        allowedMimeTypes: acceptedTypes,
        allowedExtensions: [".pdf"],
      });

      setValidationErrors(validation.errors);
      return validation.isValid;
    },
    [maxFileSize, acceptedTypes]
  );

  const validateFileSecurity = useCallback(
    async (file: File) => {
      setIsValidating(true);
      setValidationErrors([]);
      setValidationWarnings([]);
      setSecurityValidation(null);

      try {
        // Get user identifier for rate limiting (could be user ID, IP, etc.)
        const userIdentifier = `user_${Date.now()}`; // Placeholder - use actual user ID in production

        const validation = await validateTermsConditionsFileSecurity(
          file,
          {
            maxFileSize,
            allowedMimeTypes: acceptedTypes,
            allowedExtensions: [".pdf"],
          },
          userIdentifier
        );

        setSecurityValidation(validation);

        if (!validation.isValid) {
          const userFriendlyErrors = formatSecurityErrors(validation);
          setValidationErrors(userFriendlyErrors);
        } else {
          setValidationWarnings(validation.warnings);
        }

        return validation.isValid;
      } catch (error) {
        console.error("Security validation error:", error);

        if (error instanceof FileSecurityError) {
          switch (error.code) {
            case SecurityErrorCodes.RATE_LIMIT_EXCEEDED:
              setValidationErrors([t("error.rateLimitExceeded")]);
              break;
            case SecurityErrorCodes.MALWARE_DETECTED:
              setValidationErrors([t("error.malwareDetected")]);
              break;
            case SecurityErrorCodes.SUSPICIOUS_CONTENT:
              setValidationErrors([t("error.suspiciousContent")]);
              break;
            default:
              setValidationErrors([t("error.securityValidationFailed")]);
          }
        } else {
          setValidationErrors([t("error.validationFailed")]);
        }

        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [maxFileSize, acceptedTypes, t]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      // First do quick validation for immediate feedback
      const quickValidation = validateFileQuick(file);

      if (!quickValidation) {
        setSelectedFile(null);
        return;
      }

      // Set file temporarily while we do security validation
      setSelectedFile(file);
      setValidationErrors([]);
      setValidationWarnings([]);

      // Perform comprehensive security validation
      const isSecure = await validateFileSecurity(file);

      if (!isSecure) {
        setSelectedFile(null);
      }
    },
    [validateFileQuick, validateFileSecurity]
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
    setUploadProgress(0);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Create promise to handle the upload
      const uploadPromise = new Promise<TermsConditionsDocument>(
        (resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                  // Transform response to TermsConditionsDocument
                  const document: TermsConditionsDocument = {
                    id: response.documentId,
                    companyId: response.companyId || "",
                    fileName: response.fileName,
                    originalFileName: response.originalFileName,
                    fileSize: response.fileSize,
                    mimeType: response.mimeType,
                    url: response.fileUrl,
                    uploadedAt: response.uploadedAt,
                    uploadedBy: response.uploadedBy,
                    isActive: response.isActive,
                    version: response.version,
                    checksum: response.checksum || "",
                  };
                  resolve(document);
                } else {
                  reject(new Error(response.message || "Upload failed"));
                }
              } catch (parseError) {
                reject(new Error("Invalid response format"));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(
                  new Error(
                    errorResponse.message ||
                      `Upload failed with status ${xhr.status}`
                  )
                );
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during upload"));
          };

          xhr.ontimeout = () => {
            reject(new Error("Upload timeout"));
          };

          // Set timeout to 5 minutes
          xhr.timeout = 5 * 60 * 1000;

          // Get the API endpoint - this would need to be configured based on your API setup
          const apiEndpoint = `/api/companies/current/terms-conditions`;

          xhr.open("POST", apiEndpoint);

          // Add authorization header if needed
          const token = localStorage.getItem("authToken"); // Adjust based on your auth implementation
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.send(formData);
        }
      );

      const document = await uploadPromise;

      // Success
      setUploadProgress(100);
      onUploadComplete(document);

      toast.success(t("uploadSuccess"), {
        description: t("uploadSuccessDescription", {
          fileName: selectedFile.name,
        }),
      });

      // Reset state
      setSelectedFile(null);
      setValidationErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";

      onUploadError(errorMessage);

      toast.error(t("uploadError"), {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, onUploadComplete, onUploadError, t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    setSecurityValidation(null);
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
                <p className="text-sm font-medium">{t("uploading")}</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  {uploadProgress}% {t("complete")}
                </p>
              </div>
            </div>
          ) : isValidating ? (
            <div className="space-y-4 w-full max-w-xs">
              <Shield className="h-8 w-8 animate-pulse mx-auto text-blue-500" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("validating")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("securityScanInProgress")}
                </p>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4 w-full max-w-sm">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                {securityValidation && (
                  <div className="flex items-center gap-1">
                    {securityValidation.securityScore >= 90 ? (
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                    ) : securityValidation.securityScore >= 70 ? (
                      <Shield className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-orange-500" />
                    )}
                    <Badge
                      variant={
                        securityValidation.securityScore >= 90
                          ? "default"
                          : securityValidation.securityScore >= 70
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {t("securityScore")}: {securityValidation.securityScore}
                      /100
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("fileSelected")}</p>
                <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                  <Button
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
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  {securityValidation && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{t("validated")}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={disabled}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("upload")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("dragDropOrClick")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("fileRequirements", {
                    maxSize: formatFileSize(maxFileSize),
                    types: "PDF",
                  })}
                </p>
              </div>
              <Button variant="outline" disabled={disabled}>
                <FileText className="h-4 w-4 mr-2" />
                {t("browseFiles")}
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

      {/* Security Warnings */}
      {validationWarnings.length > 0 && validationErrors.length === 0 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("securityWarnings")}</p>
              <ul className="list-disc list-inside space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Validation Details */}
      {securityValidation && validationErrors.length === 0 && (
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            <span>{t("securityChecksCompleted")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              {securityValidation.securityChecks.mimeTypeValid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>{t("fileTypeCheck")}</span>
            </div>
            <div className="flex items-center gap-1">
              {securityValidation.securityChecks.sizeValid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>{t("fileSizeCheck")}</span>
            </div>
            <div className="flex items-center gap-1">
              {securityValidation.securityChecks.structureValid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>{t("fileStructureCheck")}</span>
            </div>
            <div className="flex items-center gap-1">
              {securityValidation.securityChecks.malwareScanPassed ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>{t("malwareScanCheck")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
