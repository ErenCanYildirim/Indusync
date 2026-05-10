"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Loader2,
  Shield,
  Download,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { companyApi } from "@/lib/api/company";
import { TermsConditionsViewer } from "./terms-conditions-viewer";
import {
  TermsConditionsDocument,
  type AccessContext,
} from "@/lib/types/terms-conditions";
import { cn } from "@/lib/utils";
import {
  secureDocumentAccess,
  canViewTermsConditions,
  checkDocumentAccessRateLimit,
  logAccessAttempt,
  getUserContext,
  type UserContext,
  type AccessPermissions,
} from "@/lib/utils/access-control";

interface TermsConditionsAccessButtonProps {
  companyId: string;
  companyName: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showBadge?: boolean;
  fullWidth?: boolean;
  mode?: "view" | "download" | "both"; // New prop to control functionality
  accessContext?: AccessContext; // Context for audit logging
  orderId?: string; // Optional order ID for context
  onError?: (error: string) => void;
  onAccessTracked?: (companyId: string) => void;
}

export function TermsConditionsAccessButton({
  companyId,
  companyName,
  variant = "outline",
  size = "sm",
  className = "",
  showBadge = false,
  fullWidth = false,
  mode = "view",
  accessContext = "COMPANY_PROFILE",
  orderId,
  onError,
  onAccessTracked,
}: TermsConditionsAccessButtonProps) {
  const t = useTranslations("termsConditions");
  const [isLoading, setIsLoading] = useState(true);
  const [hasDocument, setHasDocument] = useState(false);
  const [documentData, setDocumentData] =
    useState<TermsConditionsDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCheckingDocument, setIsCheckingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessPermissions, setAccessPermissions] =
    useState<AccessPermissions | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  // Additional backend utility fields
  const [formattedFileSize, setFormattedFileSize] = useState<string | null>(
    null
  );
  const [fileExtension, setFileExtension] = useState<string | null>(null);
  const [isPdfDocument, setIsPdfDocument] = useState<boolean>(false);

  // Initialize user context and check permissions on mount
  useEffect(() => {
    initializeAccessControl();
    checkDocumentAvailability();
  }, [companyId]);

  const initializeAccessControl = async () => {
    try {
      // Get current user context
      const context = getUserContext();
      setUserContext(context);

      // Check access permissions
      const permissions = canViewTermsConditions(context, companyId);
      setAccessPermissions(permissions);

      // Check rate limiting
      if (context.userId && documentData?.id) {
        const rateLimit = checkDocumentAccessRateLimit(
          context.userId,
          documentData.id
        );
        setRateLimitExceeded(!rateLimit.allowed);
      }
    } catch (err) {
      console.error("Error initializing access control:", err);
      setError("Failed to initialize access control");
    }
  };

  const checkDocumentAvailability = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await companyApi.getTermsConditions(companyId);

      // Check if the API call was successful using backend success fields
      const isSuccess = response.success && response.successful;
      const hasDocumentData = !!response.documentId && !!response.fileUrl;

      setHasDocument(isSuccess && hasDocumentData);

      if (isSuccess && hasDocumentData && response.documentId) {
        // Transform response to TermsConditionsDocument using all available backend fields
        const doc: TermsConditionsDocument = {
          id: response.documentId,
          companyId: companyId,
          fileName: response.fileName || "",
          originalFileName: response.originalFileName || "",
          fileSize: response.fileSize || 0,
          mimeType: response.mimeType || "",
          url: response.fileUrl || "",
          uploadedAt: response.uploadedAt || "",
          uploadedBy: response.uploadedBy || "",
          isActive: response.isActive || false,
          version: response.version || 0,
          checksum: response.checksum || "",
        };
        setDocumentData(doc);

        // Set additional backend utility fields
        setFormattedFileSize(response.formattedFileSize || null);
        setFileExtension(response.fileExtension || null);
        setIsPdfDocument(response.pdfDocument || false);
      } else {
        setDocumentData(null);
        setFormattedFileSize(null);
        setFileExtension(null);
        setIsPdfDocument(false);

        // Use backend error message if available
        if (!isSuccess && response.message) {
          setError(response.message);
        }
      }
    } catch (err) {
      console.error("Error checking T&C document availability:", err);
      setHasDocument(false);
      setDocumentData(null);
      setFormattedFileSize(null);
      setFileExtension(null);
      setIsPdfDocument(false);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check document availability"
      );

      if (onError) {
        onError(
          err instanceof Error
            ? err.message
            : "Failed to check document availability"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectDownload = async () => {
    if (!hasDocument || !documentData) {
      toast({
        title: t("error.noDocument"),
        description: t("error.noDocumentDescription"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a temporary link element to trigger download
      const link = window.document.createElement("a");
      link.href = documentData.url;
      link.download =
        documentData.originalFileName ||
        documentData.fileName ||
        "terms-conditions.pdf";
      link.target = "_blank";

      // Append to body, click, and remove
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast({
        title: t("downloadSuccess") || "Download started",
        description:
          t("downloadSuccessDescription", { companyName }) ||
          `Terms & Conditions from ${companyName} download started`,
      });
    } catch (err) {
      console.error("Error downloading T&C document:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Failed to download document";

      toast({
        title: t("error.downloadFailed") || "Download failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleAccessDocument = async () => {
    if (!hasDocument || !documentData || !userContext) {
      toast({
        title: t("error.noDocument"),
        description: t("error.noDocumentDescription"),
        variant: "destructive",
      });
      return;
    }

    // Check access permissions
    if (!accessPermissions?.canView) {
      const errorMessage = accessPermissions?.reason || "Access denied";

      logAccessAttempt(
        userContext,
        companyId,
        accessContext,
        false,
        errorMessage,
        orderId
      );

      toast({
        title: t("error.accessDenied"),
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    // Check rate limiting
    if (rateLimitExceeded) {
      const errorMessage = "Rate limit exceeded. Please try again later.";

      toast({
        title: t("error.rateLimitExceeded"),
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    setIsCheckingDocument(true);

    try {
      // Use secure document access with automatic audit logging
      // use this feature later
      // const result = await secureDocumentAccess(
      //   companyId,
      //   userContext,
      //   accessContext,
      //   orderId
      // );


      // Open the viewer
      setIsViewerOpen(true);

      // Log successful access
      logAccessAttempt(
        userContext,
        companyId,
        accessContext,
        true,
        "Document accessed successfully",
        orderId
      );

      // Notify parent component
      if (onAccessTracked) {
        onAccessTracked(companyId);
      }

      toast({
        title: t("accessSuccess"),
        description: t("accessSuccessDescription", { companyName }),
      });
    } catch (err) {
      console.error("Error accessing T&C document:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Failed to access document";

      // Log failed access attempt
      logAccessAttempt(
        userContext,
        companyId,
        accessContext,
        false,
        errorMessage,
        orderId
      );

      toast({
        title: t("error.accessFailed"),
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsCheckingDocument(false);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  // Don't render if loading initially
  if (isLoading) {
    return (
      <Skeleton
        className={cn(
          "h-8",
          size === "sm" && "h-8 w-24",
          size === "default" && "h-9 w-28",
          size === "lg" && "h-10 w-32",
          fullWidth && "w-full"
        )}
      />
    );
  }

  // Don't render if no document available
  if (!hasDocument || error) {
    return null;
  }

  // Show access denied message if user doesn't have permissions
  if (accessPermissions && !accessPermissions.canView) {
    return (
      <Alert variant="destructive" className={cn("text-sm", className)}>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          {t("error.accessDenied")}: {accessPermissions.reason}
        </AlertDescription>
      </Alert>
    );
  }

  // Show rate limit message if exceeded
  if (rateLimitExceeded) {
    return (
      <Alert variant="destructive" className={cn("text-sm", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t("error.rateLimitExceeded")}</AlertDescription>
      </Alert>
    );
  }

  const getButtonIcon = () => {
    if (isCheckingDocument) {
      return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    }
    switch (mode) {
      case "download":
        return <Download className="h-4 w-4 mr-2" />;
      case "view":
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "download":
        return t("downloadTermsConditions") || "Download Terms & Conditions";
      case "view":
      default:
        return t("viewTermsConditions") || "View Terms & Conditions";
    }
  };

  const handleButtonClick = () => {
    switch (mode) {
      case "download":
        handleDirectDownload();
        break;
      case "view":
      default:
        handleAccessDocument();
        break;
    }
  };

  const buttonContent = (
    <>
      {getButtonIcon()}
      {getButtonText()}
      {formattedFileSize && (
        <span className="text-xs text-muted-foreground ml-1">
          ({formattedFileSize})
        </span>
      )}
      {showBadge && (
        <Badge variant="outline" className="ml-2 text-xs">
          <Shield className="h-3 w-3 mr-1" />
          {t("official")}
          {isPdfDocument && <span className="ml-1">PDF</span>}
        </Badge>
      )}
    </>
  );

  // Handle "both" mode with dual buttons
  if (mode === "both") {
    return (
      <>
        <div className={cn("flex gap-2", fullWidth && "w-full")}>
          <Button
            variant={variant}
            size={size}
            onClick={handleAccessDocument}
            disabled={isCheckingDocument || !hasDocument}
            className={cn(
              "flex items-center gap-2",
              fullWidth && "flex-1 justify-center",
              className
            )}
          >
            {isCheckingDocument ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {t("viewTermsConditions") || "View"}
            {showBadge && (
              <Badge variant="outline" className="ml-2 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {t("official")}
              </Badge>
            )}
          </Button>

          <Button
            variant={variant === "default" ? "outline" : variant}
            size={size}
            onClick={handleDirectDownload}
            disabled={isCheckingDocument || !hasDocument}
            className={cn(
              "flex items-center gap-2",
              fullWidth && "flex-1 justify-center"
            )}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("downloadTermsConditions") || "Download"}
            {formattedFileSize && (
              <span className="text-xs text-muted-foreground ml-1">
                ({formattedFileSize})
              </span>
            )}
            {showBadge && isPdfDocument && (
              <Badge variant="outline" className="ml-2 text-xs">
                <span>PDF</span>
              </Badge>
            )}
          </Button>
        </div>

        {/* Terms & Conditions Viewer Modal */}
        {documentData && (
          <TermsConditionsViewer
            document={documentData}
            companyName={companyName}
            isOpen={isViewerOpen}
            onClose={handleCloseViewer}
          />
        )}
      </>
    );
  }

  // Single button mode (view or download)
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        disabled={isCheckingDocument || !hasDocument}
        className={cn(
          "flex items-center gap-2",
          fullWidth && "w-full justify-center",
          className
        )}
      >
        {buttonContent}
      </Button>

      {/* Terms & Conditions Viewer Modal */}
      {documentData && (
        <TermsConditionsViewer
          document={documentData}
          companyName={companyName}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}

// Simplified version for cases where you just want to check availability
export function useTermsConditionsAvailability(companyId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasDocument, setHasDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!companyId) return;

      setIsLoading(true);
      setError(null);

      try {
        const hasTC = await companyApi.hasTermsConditions(companyId);
        setHasDocument(hasTC);
      } catch (err) {
        console.error("Error checking T&C availability:", err);
        setHasDocument(false);
        setError(
          err instanceof Error ? err.message : "Failed to check availability"
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [companyId]);

  return { isLoading, hasDocument, error };
}

// Compact version for inline use
interface CompactTermsConditionsButtonProps {
  companyId: string;
  companyName: string;
  className?: string;
  mode?: "view" | "download" | "both";
}

export function CompactTermsConditionsButton({
  companyId,
  companyName,
  className = "",
  mode = "download", // Default to download for compact version
}: CompactTermsConditionsButtonProps) {
  const { hasDocument, isLoading } = useTermsConditionsAvailability(companyId);

  if (isLoading || !hasDocument) {
    return null;
  }

  return (
    <TermsConditionsAccessButton
      companyId={companyId}
      companyName={companyName}
      variant="ghost"
      size="sm"
      className={cn("h-6 px-2 text-xs", className)}
      showBadge={false}
      mode={mode}
    />
  );
}
