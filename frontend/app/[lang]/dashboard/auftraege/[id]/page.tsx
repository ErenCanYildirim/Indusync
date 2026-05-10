"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building,
  CheckCircle,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react";

// Import project service and backend order hook
import { Project, getProjectById } from "@/lib/projects-service";
import {
  useOrder,
  useProposeDeadlineExtension,
  useDeadlineExtensionProposal,
  useConfirmDeadlineExtension,
  useRejectDeadlineExtension,
  useCancelDeadlineExtensionProposal,
  useRequestCompletion,
  useConfirmCompletion,
  useRejectCompletion,
  useCancelCompletion,
  useCompletionRequest,
  useInterestedProviders,
} from "@/lib/hooks/useOrders";
import { useQuery } from "@tanstack/react-query";
import { DeadlineExtensionModal } from "@/components/orders/DeadlineExtensionModal";
import { DeadlineExtensionRejectionModal } from "@/components/orders/DeadlineExtensionRejectionModal";
import { CompletionRequestModal } from "@/components/orders/CompletionRequestModal";
import { CompletionRejectionModal } from "@/components/orders/CompletionRejectionModal";
import { DocumentsSection } from "@/components/orders/DocumentsSection";
import { ApplicationsSection } from "@/components/orders/ApplicationsSection";
import { useAuth } from "@/lib/hooks/useAuth";
import type { CompletionRequest } from "@/lib/types/completion-request";
import { TermsConditionsAccessButton } from "@/components/terms-conditions/terms-conditions-access-button";
import {
  getCompletionStatusDisplayText,
  getCompletionStatusColor,
  isPendingCompletionRequest,
} from "@/lib/types/completion-request";
import type { OrderDetailResponse } from "@/lib/api/types";
import { mapCompanyMatchesToApplications } from "@/lib/utils/application-utils";

// Component interfaces
interface ProjectDetailPageProps {
  params: {
    id: string;
    lang: string;
  };
}

interface DisplayData {
  title: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  budget: string;
  client: string;
  applications: number;
}

// Event handler types
type ButtonClickHandler = () => void;
type ModalSubmitHandler = (value: string) => void;
type ExtensionSubmitHandler = (iso: string) => void;
type CompletionSubmitHandler = (message?: string) => void;
type RejectionSubmitHandler = (reason?: string) => void;

// Helper function to check if ID is a UUID
function isUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Type guard to check if data is an order
function isOrderData(data: any): data is OrderDetailResponse {
  return (
    data &&
    typeof data === "object" &&
    "id" in data &&
    "title" in data &&
    "status" in data
  );
}

// Type guard to check if data is a project
function isProjectData(data: any): data is Project {
  return (
    data && typeof data === "object" && "title" in data && "location" in data
  );
}

// Type guard to check if completion request is valid
function isValidCompletionRequest(request: any): request is CompletionRequest {
  return (
    request &&
    typeof request === "object" &&
    "id" in request &&
    "status" in request
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("Dashboard.orders.orderDetail");
  const tCommon = useTranslations("Common");
  const orderId = params.id as string;
  const isBackendOrder = isUUID(orderId);

  // States for mock project handling
  const [mockProject, setMockProject] = React.useState<Project | null>(null);
  const [mockLoading, setMockLoading] = React.useState(false);
  const [mockError, setMockError] = React.useState<string | null>(null);

  // Backend order hook (only used for UUID orders)
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId, isBackendOrder);

  // Deadline extension hooks
  const proposeExtension = useProposeDeadlineExtension();
  const confirmExtension = useConfirmDeadlineExtension();
  const rejectExtension = useRejectDeadlineExtension();
  const cancelExtension = useCancelDeadlineExtensionProposal();
  const { data: proposal } = useDeadlineExtensionProposal(
    orderId,
    isBackendOrder
  );

  // Completion request hooks
  const requestCompletion = useRequestCompletion();
  const confirmCompletion = useConfirmCompletion();
  const rejectCompletion = useRejectCompletion();
  const cancelCompletion = useCancelCompletion();
  const { data: completionRequest } = useCompletionRequest(
    orderId,
    isBackendOrder
  );

  // Modal states
  const [extendOpen, setExtendOpen] = React.useState(false);
  const [rejectExtensionOpen, setRejectExtensionOpen] = React.useState(false);
  const [completionOpen, setCompletionOpen] = React.useState(false);
  const [rejectCompletionOpen, setRejectCompletionOpen] = React.useState(false);

  const { user } = useAuth();
  const currentCompanyId = user?.currentCompanyMembership?.companyId;

  // Handle mock project loading for integer IDs
  React.useEffect(() => {
    if (!isBackendOrder) {
      const fetchProject = async () => {
        try {
          setMockLoading(true);
          const projectId = parseInt(orderId, 10);
          if (isNaN(projectId)) {
            setMockError("Ungültige Projekt-ID.");
            return;
          }

          const data = await getProjectById(projectId);
          setMockProject(data);

          if (!data) {
            setMockError("Auftrag nicht gefunden.");
          } else {
            setMockError(null);
          }
        } catch (err) {
          console.error("Failed to fetch project:", err);
          setMockError(
            "Fehler beim Laden des Auftrags. Bitte versuchen Sie es später erneut."
          );
        } finally {
          setMockLoading(false);
        }
      };

      fetchProject();
    }
  }, [orderId, isBackendOrder]);

  const getBadgeVariant = (status: string) => {
    const upper = (status || "").toUpperCase();
    if (upper === "DRAFT") return "entwurf";
    if (upper === "PUBLISHED") return "ausgeschrieben";
    if (upper === "MATCHED") return "auftrag_vergeben";
    if (upper === "IN_PROGRESS" || upper === "ACTIVE") return "aktiv";
    if (upper === "COMPLETED") return "abgeschlossen";
    if (upper === "CANCELLED" || upper === "OVERDUE") return "in_verzug";
    return "aktiv";
  };

  const handleGoBack = () => {
    router.push("/dashboard/auftraege");
  };

  const handleEditProject = () => {
    router.push(`/dashboard/auftraege/${orderId}/edit`);
  };

  const handleDeleteProject = () => {
    // Implement delete functionality
    console.log("Delete project", orderId);
  };

  // Helper to format ISO date strings in German locale
  const formatDate = (iso?: string) => {
    return iso ? new Date(iso).toLocaleDateString("de-DE") : "-";
  };

  // Determine loading state and data
  const isLoading = isBackendOrder ? orderLoading : mockLoading;
  const hasError = isBackendOrder ? orderError : mockError;
  const currentData = isBackendOrder ? order : mockProject;

  const canExtendDeadline = isBackendOrder && order?.status === "IN_PROGRESS";
  const canRequestCompletion =
    isBackendOrder && order?.status === "IN_PROGRESS";

  // Determine user role relative to this order
  const isProviderView =
    isBackendOrder && order?.providerId === currentCompanyId;

  const isClientView = isBackendOrder && order?.companyId === currentCompanyId;

  // Fetch interested providers (applications) from backend
  const { data: interestedProvidersData, isLoading: applicationsLoading } =
    useInterestedProviders(orderId, isBackendOrder && !!isClientView);

  // Deadline extension logic
  const hasPendingProposal =
    isBackendOrder && proposal && proposal.status === "PROPOSED";

  const canRejectProposal =
    hasPendingProposal && proposal?.requesterCompanyId !== currentCompanyId;

  const canCancelProposal =
    hasPendingProposal && proposal?.requesterCompanyId === currentCompanyId;

  const canConfirmProposal =
    hasPendingProposal && proposal?.requesterCompanyId !== currentCompanyId;

  // Completion request logic with proper type guards
  const validCompletionRequest = isValidCompletionRequest(completionRequest)
    ? completionRequest
    : null;
  const hasPendingCompletion =
    isBackendOrder &&
    validCompletionRequest &&
    isPendingCompletionRequest(validCompletionRequest);

  const canConfirmCompletionRequest =
    hasPendingCompletion &&
    validCompletionRequest?.requesterCompanyId !== currentCompanyId;

  const canRejectCompletionRequest =
    hasPendingCompletion &&
    validCompletionRequest?.requesterCompanyId !== currentCompanyId;

  const canCancelCompletionRequest =
    hasPendingCompletion &&
    validCompletionRequest?.requesterCompanyId === currentCompanyId;

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg mb-4">{t("invalidProjectId")}</p>
          <Button onClick={handleGoBack}>{t("backToOverview")}</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">
            {isBackendOrder
              ? t("loadingOrderDetails")
              : t("loadingProjectDetails")}
          </span>
        </div>
      </div>
    );
  }

  if (hasError || !currentData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive text-lg mb-4">
            {hasError ||
              (isBackendOrder ? t("orderNotFound") : t("projectNotFound"))}
          </p>
          <Button onClick={handleGoBack}>{t("backToOverview")}</Button>
        </div>
      </div>
    );
  }

  // Extract data based on whether it's backend order or mock project with proper type guards
  const displayData =
    isBackendOrder && isOrderData(order)
      ? {
          title: order.title || "",
          location: order.serviceAddress?.city || "",
          status: order.status || "",
          startDate: order.startDate || "",
          endDate: order.deadline || "",
          description: order.description || "",
          budget: order.budget?.toString() || "",
          client: order.companyName || "",
          applications: interestedProvidersData?.totalElements || 0,
        }
      : isProjectData(mockProject)
      ? {
          title: mockProject.title || "",
          location: mockProject.location || "",
          status: mockProject.status || "",
          startDate: mockProject.startDate || "",
          endDate: mockProject.endDate || "",
          description: mockProject.description || "",
          budget: mockProject.budget || "",
          client: mockProject.client || "",
          applications: mockProject.applications || 0,
        }
      : {
          title: "",
          location: "",
          status: "",
          startDate: "",
          endDate: "",
          description: "",
          budget: "",
          client: "",
          applications: 0,
        };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back button navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToOverview")}
        </Button>
      </div>

      {/* Notice for mock projects */}
      {!isBackendOrder && (
        <div className="mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700">
              <strong>{tCommon("actions.note")}:</strong>{" "}
              {t("demoProjectNotice")}
            </p>
          </div>
        </div>
      )}

      {/* Main project header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {displayData.title}
          </h1>

          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-1.5 h-4 w-4" />
            <span>{displayData.location}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant={getBadgeVariant(displayData.status)}
            className="text-sm px-3 py-1"
          >
            {/* Localized label via Common.status using normalized keys */}
            {(() => {
              const s = (displayData.status || "").toUpperCase();
              if (s === "DRAFT") return tCommon("status.draft");
              if (s === "PUBLISHED") return tCommon("status.published");
              if (s === "MATCHED")
                return tCommon("status.assigned", { default: "Assigned" });
              if (s === "IN_PROGRESS" || s === "ACTIVE")
                return tCommon("status.active");
              if (s === "COMPLETED") return tCommon("status.completed");
              if (s === "CANCELLED") return tCommon("status.cancelled");
              return s || "";
            })()}
          </Badge>
          {/* Edit allowed only for backend orders in DRAFT; keep view for demo projects */}
          {isClientView && isBackendOrder && order?.status === "DRAFT" && (
            <Button variant="outline" size="sm" onClick={handleEditProject}>
              {t("editOrder")}
            </Button>
          )}
          {!isBackendOrder && isClientView && (
            <Button variant="outline" size="sm" onClick={handleEditProject}>
              {t("viewProject")}
            </Button>
          )}
        </div>
      </div>

      {/* Completion request banner */}
      {validCompletionRequest && (
        <div
          className={`mb-4 rounded-lg border p-4 ${getCompletionStatusColor(
            validCompletionRequest.status
          )}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <span>
              {validCompletionRequest.status === "REQUESTED" && (
                <>
                  {validCompletionRequest.requesterCompanyId ===
                  order?.providerId
                    ? t("completionRequest.providerMarkedCompleted")
                    : t("completionRequest.clientMarkedCompleted")}
                  {validCompletionRequest.completionMessage && (
                    <div className="mt-2 p-3 bg-white rounded border">
                      <p className="text-sm font-medium mb-1">
                        {t("completionRequest.completionMessage")}
                      </p>
                      <p className="text-sm">
                        {validCompletionRequest.completionMessage}
                      </p>
                    </div>
                  )}
                </>
              )}
              {validCompletionRequest.status === "CONFIRMED" && (
                <>
                  {t("completionRequest.orderSuccessfullyCompleted")}
                  {validCompletionRequest.confirmedAt && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t("completionRequest.confirmedOn")}{" "}
                      {formatDate(validCompletionRequest.confirmedAt)})
                    </span>
                  )}
                </>
              )}
              {validCompletionRequest.status === "REJECTED" && (
                <>
                  {t("completionRequest.completionRejected")}
                  {validCompletionRequest.rejectedAt && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t("completionRequest.rejectedOn")}{" "}
                      {formatDate(validCompletionRequest.rejectedAt)})
                    </span>
                  )}
                </>
              )}
              {validCompletionRequest.status === "CANCELLED" && (
                <>
                  {t("completionRequest.completionRequestCancelled")}
                  {validCompletionRequest.cancelledAt && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t("completionRequest.cancelledOn")}{" "}
                      {formatDate(validCompletionRequest.cancelledAt)})
                    </span>
                  )}
                </>
              )}
            </span>
          </div>

          {/* Show rejection reason if available */}
          {validCompletionRequest.status === "REJECTED" &&
            validCompletionRequest.rejectionReason && (
              <div className="mb-3 p-3 bg-white rounded border border-red-100">
                <p className="text-sm font-medium text-red-800 mb-1">
                  {t("completionRequest.rejectionReason")}
                </p>
                <p className="text-sm text-red-700">
                  {validCompletionRequest.rejectionReason}
                </p>
              </div>
            )}

          {/* Action buttons only for pending completion requests */}
          {validCompletionRequest.status === "REQUESTED" && (
            <div className="flex flex-wrap gap-2">
              {canConfirmCompletionRequest && (
                <Button
                  size="sm"
                  onClick={() => {
                    confirmCompletion.mutate(orderId);
                  }}
                  disabled={confirmCompletion.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {confirmCompletion.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("completionRequest.confirming")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t("completionRequest.confirmCompletion")}
                    </>
                  )}
                </Button>
              )}

              {canRejectCompletionRequest && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectCompletionOpen(true)}
                  disabled={rejectCompletion.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("completionRequest.rejectCompletion")}
                </Button>
              )}

              {canCancelCompletionRequest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    cancelCompletion.mutate(orderId);
                  }}
                  disabled={cancelCompletion.isPending}
                >
                  {cancelCompletion.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("completionRequest.cancelling")}
                    </>
                  ) : (
                    t("completionRequest.cancelRequest")
                  )}
                </Button>
              )}

              {!canConfirmCompletionRequest &&
                !canRejectCompletionRequest &&
                !canCancelCompletionRequest && (
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {t("completionRequest.waitingForConfirmation")}
                  </span>
                )}
            </div>
          )}
        </div>
      )}

      {/* Deadline extension proposal banner */}
      {proposal && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            proposal.status === "PROPOSED"
              ? "border-yellow-200 bg-yellow-50"
              : proposal.status === "CONFIRMED"
              ? "border-green-200 bg-green-50"
              : proposal.status === "REJECTED"
              ? "border-red-200 bg-red-50"
              : "border-gray-200 bg-gray-50" // CANCELLED
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <span>
              {proposal.status === "PROPOSED" && (
                <>
                  {proposal.requesterCompanyId === order?.providerId
                    ? t("deadlineExtension.providerProposedExtension")
                    : t("deadlineExtension.clientProposedExtension")}
                  <strong>{formatDate(proposal.proposedDeadline)}</strong>
                </>
              )}
              {proposal.status === "CONFIRMED" && (
                <>
                  {t("deadlineExtension.deadlineExtendedTo")}{" "}
                  <strong>{formatDate(proposal.proposedDeadline)}</strong>
                  {proposal.confirmedAt && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t("deadlineExtension.confirmedOn")}{" "}
                      {formatDate(proposal.confirmedAt)})
                    </span>
                  )}
                </>
              )}
              {proposal.status === "REJECTED" && (
                <>
                  {t("deadlineExtension.deadlineExtensionRejected")}{" "}
                  <strong>{formatDate(proposal.proposedDeadline)}</strong> wurde
                  abgelehnt
                  {proposal.rejectedAt && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t("deadlineExtension.rejectedOn")}{" "}
                      {formatDate(proposal.rejectedAt)})
                    </span>
                  )}
                </>
              )}
              {proposal.status === "CANCELLED" && (
                <>
                  {t("deadlineExtension.deadlineExtensionCancelled")}
                  {proposal.cancelledAt && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({t("deadlineExtension.cancelledOn")}{" "}
                      {formatDate(proposal.cancelledAt)})
                    </span>
                  )}
                </>
              )}
            </span>
          </div>

          {/* Show rejection reason if available */}
          {proposal.status === "REJECTED" && proposal.rejectionReason && (
            <div className="mb-3 p-3 bg-white rounded border border-red-100">
              <p className="text-sm font-medium text-red-800 mb-1">
                {t("deadlineExtension.rejectionReason")}
              </p>
              <p className="text-sm text-red-700">{proposal.rejectionReason}</p>
            </div>
          )}

          {/* Action buttons only for pending proposals */}
          {proposal.status === "PROPOSED" && (
            <div className="flex flex-wrap gap-2">
              {canConfirmProposal && (
                <Button
                  size="sm"
                  onClick={() => {
                    confirmExtension.mutate({
                      orderId,
                      newDeadlineIso: proposal.proposedDeadline,
                    });
                  }}
                  disabled={confirmExtension.isPending}
                >
                  {confirmExtension.isPending
                    ? t("deadlineExtension.confirming")
                    : t("deadlineExtension.confirmDeadline")}
                </Button>
              )}

              {canRejectProposal && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectExtensionOpen(true)}
                  disabled={rejectExtension.isPending}
                >
                  {t("deadlineExtension.rejectDeadline")}
                </Button>
              )}

              {canCancelProposal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    cancelExtension.mutate(orderId);
                  }}
                  disabled={cancelExtension.isPending}
                >
                  {cancelExtension.isPending
                    ? t("deadlineExtension.cancelling")
                    : t("deadlineExtension.cancelProposal")}
                </Button>
              )}

              {!canConfirmProposal &&
                !canRejectProposal &&
                !canCancelProposal && (
                  <span className="text-sm text-muted-foreground">
                    {t("deadlineExtension.waitingForConfirmation")}
                  </span>
                )}
            </div>
          )}
        </div>
      )}

      {/* Project details card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            {/* Date information */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("startDate")}
              </h3>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{displayData.startDate}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("endDate")}
              </h3>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{displayData.endDate}</span>
              </div>
            </div>

            {/* Client information */}
            {displayData.client && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t("clientCompany")}
                </h3>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{displayData.client}</span>
                </div>

                {order && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push(
                          `/dashboard/dienstleister/${order.companyId}`
                        );
                      }}
                      className="w-full justify-center"
                    >
                      <Building className="h-4 w-4 mr-2" />
                      {t("viewClientProfile")}
                    </Button>
                    <TermsConditionsAccessButton
                      companyId={order.companyId}
                      companyName={order.companyName || displayData.client}
                      variant="outline"
                      size="sm"
                      fullWidth={true}
                      onError={(error) => {
                        console.error("T&C access error:", error);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("orderAreas")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {isBackendOrder && order ? (
                  <>
                    <Badge variant="outline" className="bg-background">
                      {order.primaryCategory}
                    </Badge>
                    {order.additionalCategories?.map((category, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-background"
                      >
                        {category}
                      </Badge>
                    ))}
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-background">
                      {t("demoData.electricalEngineering")}
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      {t("demoData.mechanics")}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("orderIndustry")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {isBackendOrder && order ? (
                  order.targetIndustries?.map((industry, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-background"
                    >
                      {industry}
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="outline" className="bg-background">
                      {t("demoData.agricultureAndResources")}
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      {t("demoData.manufacturingIndustry")}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("placementType")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {isBackendOrder && order ? (
                  order.placementTypes?.map((type, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-background"
                    >
                      {type}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="bg-background">
                    {t("demoData.workContract")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("certificationsForOrder")}
              </h3>
              {isBackendOrder && order ? (
                order.requiredCertifications &&
                order.requiredCertifications.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {order.requiredCertifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center text-emerald-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {t("noSpecialCertifications")}
                  </span>
                )
              ) : (
                <div className="flex items-center text-emerald-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{t("demoData.iso14001Certified")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description section */}
          {displayData.description && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3">{t("description")}</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {displayData.description}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            {/* Edit only for backend DRAFT orders; keep demo view button */}
            {isClientView && isBackendOrder && order?.status === "DRAFT" && (
              <Button onClick={handleEditProject}>{t("editOrder")}</Button>
            )}
            {!isBackendOrder && isClientView && (
              <Button onClick={handleEditProject}>{t("viewProject")}</Button>
            )}
            {canExtendDeadline && !hasPendingProposal && (
              <Button variant="outline" onClick={() => setExtendOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                {t("extendDeadline")}
              </Button>
            )}
            {canRequestCompletion && !hasPendingCompletion && (
              <Button
                onClick={() => setCompletionOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("markAsCompleted")}
              </Button>
            )}
            {isBackendOrder && isClientView && order?.status === "DRAFT" && (
              <Button variant="destructive" onClick={handleDeleteProject}>
                {t("deleteOrder")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents section - only for backend orders */}
      {isBackendOrder && (
        <DocumentsSection
          orderId={orderId}
          isBackendOrder={isBackendOrder}
          className="mb-8"
        />
      )}

      {/* Applications section - only for backend orders and authorized users */}
      {isClientView && (
        <ApplicationsSection
          applications={
            interestedProvidersData?.data
              ? mapCompanyMatchesToApplications(
                  interestedProvidersData.data,
                  currentCompanyId
                )
              : []
          }
          isLoading={applicationsLoading}
          isClientView={isClientView}
          error={null}
          className="mb-8"
        />
      )}

      {/* Modals */}
      <DeadlineExtensionModal
        open={extendOpen}
        onOpenChange={setExtendOpen}
        loading={proposeExtension.isPending}
        onSubmit={(iso) => {
          proposeExtension.mutate({ orderId, newDeadlineIso: iso });
          setExtendOpen(false);
        }}
      />

      <DeadlineExtensionRejectionModal
        open={rejectExtensionOpen}
        onOpenChange={setRejectExtensionOpen}
        loading={rejectExtension.isPending}
        proposedDeadline={proposal?.proposedDeadline || ""}
        onSubmit={(rejectionReason) => {
          rejectExtension.mutate({ orderId, rejectionReason });
          setRejectExtensionOpen(false);
        }}
      />

      <CompletionRequestModal
        open={completionOpen}
        onOpenChange={setCompletionOpen}
        loading={requestCompletion.isPending}
        onSubmit={(completionMessage) => {
          requestCompletion.mutate({ orderId, completionMessage });
          setCompletionOpen(false);
        }}
      />

      <CompletionRejectionModal
        open={rejectCompletionOpen}
        onOpenChange={setRejectCompletionOpen}
        loading={rejectCompletion.isPending}
        onSubmit={(rejectionReason?: string) => {
          rejectCompletion.mutate({ orderId, rejectionReason });
          setRejectCompletionOpen(false);
        }}
      />
    </div>
  );
}
