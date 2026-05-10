"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  Shield,
  Award,
  FileCheck,
  Loader2,
} from "lucide-react";
import { CompanyDocument } from "@/lib/api/types";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer";
import { useDocuments } from "@/lib/hooks/useDocuments";

interface CompanyDocumentsCardProps {
  documents: CompanyDocument[];
  isLoading?: boolean;
  error?: string;
  onViewDocument?: (document: CompanyDocument) => void;
  onDownloadDocument?: (document: CompanyDocument) => void;
}

const DOCUMENT_TYPE_CONFIG = {
  VERIFICATION: {
    icon: Shield,
    label: "verification",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    category: "legalDocuments",
  },
  CERTIFICATES: {
    icon: Award,
    label: "certificates",
    color: "bg-green-100 text-green-800 border-green-200",
    category: "certifications",
  },
  CERTIFICATION_ITEM: {
    icon: FileCheck,
    label: "certificationItem",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    category: "certifications",
  },
  OTHER: {
    icon: FileText,
    label: "other",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    category: "otherDocuments",
  },
} as const;

export function CompanyDocumentsCard({
  documents,
  isLoading = false,
  error,
  onViewDocument,
  onDownloadDocument,
}: CompanyDocumentsCardProps) {
  const t = useTranslations("Profile.companyDocuments");
  const locale = useLocale();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["legalDocuments"])
  );
  const [selectedDocument, setSelectedDocument] =
    useState<CompanyDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { downloadDocument, isDownloading } = useDocuments();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categorizedDocuments = documents.reduce((acc, doc) => {
    const config = DOCUMENT_TYPE_CONFIG[doc.type] || DOCUMENT_TYPE_CONFIG.OTHER;
    const category = config.category;

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, CompanyDocument[]>);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return format(
      new Date(dateString),
      locale === "en" ? "MM/dd/yyyy" : "dd.MM.yyyy",
      {
        locale: locale === "en" ? enUS : de,
      }
    );
  };

  const handleViewDocument = (document: CompanyDocument) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
    if (onViewDocument) {
      onViewDocument(document);
    }
  };

  const handleDownloadDocument = async (document: CompanyDocument) => {
    await downloadDocument(document);
    if (onDownloadDocument) {
      onDownloadDocument(document);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocument(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("noDocuments")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(categorizedDocuments).map(
          ([category, categoryDocuments]) => {
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleCategory(category)}
                  className="w-full justify-between p-0 h-auto font-medium text-left"
                >
                  <span className="flex items-center gap-2">
                    {t(`categories.${category}`)}
                    <Badge variant="outline" className="ml-2">
                      {categoryDocuments.length}
                    </Badge>
                  </span>
                  <span
                    className={`transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                </Button>

                {isExpanded && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    {categoryDocuments.map((document) => {
                      const config =
                        DOCUMENT_TYPE_CONFIG[document.type] ||
                        DOCUMENT_TYPE_CONFIG.OTHER;
                      const IconComponent = config.icon;

                      return (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">
                                  {document.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${config.color}`}
                                >
                                  {t(`documentTypes.${config.label}`)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(document.uploadedAt)}
                                </span>
                                {document.fileSize && (
                                  <span>
                                    {formatFileSize(document.fileSize)}
                                  </span>
                                )}
                                {document.contentType && (
                                  <span className="uppercase">
                                    {document.contentType.split("/")[1]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(document)}
                              className="h-8 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {t("actions.view")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(document)}
                              className="h-8 px-2"
                              disabled={isDownloading === document.id}
                            >
                              {isDownloading === document.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3 mr-1" />
                              )}
                              {isDownloading === document.id
                                ? t("actions.downloading")
                                : t("actions.download")}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        )}
      </CardContent>

      <DocumentViewer
        document={selectedDocument}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </Card>
  );
}
