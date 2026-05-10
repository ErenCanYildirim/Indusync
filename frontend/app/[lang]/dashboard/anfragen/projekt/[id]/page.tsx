"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrder } from "@/lib/hooks/useOrders";
import {
  useExpressInterest,
  useMarkOrderViewed,
  useMatchScoreUtils,
} from "@/lib/hooks/useOrderBoard";
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useProposeDeadlineExtension,
  useDeadlineExtensionProposal,
  useConfirmDeadlineExtension,
  useRejectDeadlineExtension,
  useCancelDeadlineExtensionProposal,
} from "@/lib/hooks/useOrders";
import { DeadlineExtensionModal } from "@/components/orders/DeadlineExtensionModal";
import { DeadlineExtensionRejectionModal } from "@/components/orders/DeadlineExtensionRejectionModal";
import { TermsConditionsAccessSection } from "@/components/terms-conditions/terms-conditions-access-section";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  // Fetch order details from backend
  const { data: orderData, isLoading, error } = useOrder(id, !!id);

  // Hooks for marking viewed & expressing interest
  const markViewed = useMarkOrderViewed();
  const expressInterest = useExpressInterest();
  const { getMatchQuality } = useMatchScoreUtils();
  const proposeExtension = useProposeDeadlineExtension();
  const confirmExtension = useConfirmDeadlineExtension();
  const rejectExtension = useRejectDeadlineExtension();
  const cancelExtension = useCancelDeadlineExtensionProposal();
  const { data: proposal } = useDeadlineExtensionProposal(id, !!id);

  // Auth context to determine current company
  const { user } = useAuth();
  const currentCompanyId = user?.currentCompanyMembership?.companyId;

  // Mark as viewed once order data loaded
  React.useEffect(() => {
    if (id && orderData) {
      markViewed.mutate(id);
    }
  }, [id, orderData]);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [extendOpen, setExtendOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);

  // Determine if order is assigned and whether to allow interest
  const isAssigned = !!orderData?.providerId;
  const isAssignedToMe = orderData?.providerId === currentCompanyId;
  const canExpressInterest =
    !isAssigned &&
    (orderData?.status === "PUBLISHED" || orderData?.status === "MATCHED");
  const canExtendDeadline =
    orderData?.status === "IN_PROGRESS" && isAssignedToMe;

  const hasPendingProposal = proposal && proposal.status === "PROPOSED";

  // User can reject if they're the counterpart (not the requester) and proposal is pending
  const canRejectProposal =
    hasPendingProposal && proposal?.requesterCompanyId !== currentCompanyId;

  // User can cancel if they're the requester and proposal is pending
  const canCancelProposal =
    hasPendingProposal && proposal?.requesterCompanyId === currentCompanyId;

  // User can confirm if they're the counterpart and proposal is pending
  const canConfirmProposal =
    hasPendingProposal && proposal?.requesterCompanyId !== currentCompanyId;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <h1 className="text-xl font-semibold">Lade Projektdetails...</h1>
      </div>
    );
  }

  if (!orderData || error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-2xl font-semibold mb-4">Projekt nicht gefunden</h1>
        <p className="text-muted-foreground mb-4">
          {error?.message ||
            "Das angeforderte Projekt konnte nicht geladen werden."}
        </p>
        <Button onClick={() => router.back()}>Zurück</Button>
      </div>
    );
  }

  const handleAccept = () => {
    setConfirmOpen(true);
  };

  const handleReject = () => {
    router.back();
  };

  // Utility helpers
  const formatDate = (iso?: string) => {
    return iso ? new Date(iso).toLocaleDateString("de-DE") : "-";
  };

  return (
    <ScrollArea className="h-full">
      <div className="container py-6 space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-4"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {orderData.title}
              </h1>
              <p className="text-muted-foreground">
                Auftraggeber:{" "}
                <span className="font-medium">
                  {orderData.companyName || "Unbekannt"}
                </span>
              </p>
            </div>
          </div>

          {/* Placeholder for match score if available through context */}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Projektdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1.5">
                  Auftragsname
                </h3>
                <p className="font-medium">{orderData.title}</p>
              </div>

              {orderData.primaryCategory && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1.5">
                    Auftragskategorie
                  </h3>
                  <Badge variant="outline" className="font-normal">
                    {orderData.primaryCategory}
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {orderData.requiredSpecializations &&
              orderData.requiredSpecializations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Benötigte Spezialisierungen
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {orderData.requiredSpecializations.map((spec, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="font-normal"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Arbeitsort
              </h3>
              <p className="text-sm">
                {orderData.serviceAddress?.street}{" "}
                {orderData.serviceAddress?.houseNumber}
                <br />
                {orderData.serviceAddress?.postalCode}{" "}
                {orderData.serviceAddress?.city}
              </p>
            </div>

            {orderData.budget && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1.5">
                  Budget
                </h3>
                <p className="font-medium">
                  € {orderData.budget.toLocaleString()}
                </p>
              </div>
            )}

            {orderData.deadline && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1.5">
                  Deadline
                </h3>
                <p className="font-medium">{formatDate(orderData.deadline)}</p>
              </div>
            )}

            <Separator />

            {/* Terms & Conditions Access Section - Prominent placement for provider decision-making */}
            <TermsConditionsAccessSection
              companyId={orderData.companyId}
              companyName={orderData.companyName || "Auftraggeber"}
              orderId={id}
            />

            <div className="pt-2 flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
              {canExtendDeadline && (
                <Button variant="outline" onClick={() => setExtendOpen(true)}>
                  Deadline&nbsp;verlängern
                </Button>
              )}
              {canExpressInterest ? (
                <Button
                  onClick={handleAccept}
                  disabled={expressInterest.isPending}
                >
                  {expressInterest.isPending
                    ? "Verarbeite..."
                    : "Interesse bekunden"}
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {isAssignedToMe
                    ? "Bereits zugewiesen"
                    : isAssigned
                    ? "Auftrag vergeben"
                    : "Interesse gesendet"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {proposal && (
        <div className="container pt-4">
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
                    {proposal.requesterCompanyId === currentCompanyId
                      ? "Sie haben eine Deadline-Verlängerung vorgeschlagen: "
                      : "Der Auftraggeber hat eine Deadline-Verlängerung vorgeschlagen: "}
                    <strong>{formatDate(proposal.proposedDeadline)}</strong>
                  </>
                )}
                {proposal.status === "CONFIRMED" && (
                  <>
                    Deadline wurde verlängert auf:{" "}
                    <strong>{formatDate(proposal.proposedDeadline)}</strong>
                    {proposal.confirmedAt && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Bestätigt am {formatDate(proposal.confirmedAt)})
                      </span>
                    )}
                  </>
                )}
                {proposal.status === "REJECTED" && (
                  <>
                    Deadline-Verlängerung auf{" "}
                    <strong>{formatDate(proposal.proposedDeadline)}</strong>{" "}
                    wurde abgelehnt
                    {proposal.rejectedAt && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Abgelehnt am {formatDate(proposal.rejectedAt)})
                      </span>
                    )}
                  </>
                )}
                {proposal.status === "CANCELLED" && (
                  <>
                    Deadline-Verlängerungsvorschlag wurde storniert
                    {proposal.cancelledAt && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Storniert am {formatDate(proposal.cancelledAt)})
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
                  Grund der Ablehnung:
                </p>
                <p className="text-sm text-red-700">
                  {proposal.rejectionReason}
                </p>
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
                        orderId: id,
                        newDeadlineIso: proposal.proposedDeadline,
                      });
                    }}
                    disabled={confirmExtension.isPending}
                  >
                    {confirmExtension.isPending
                      ? "Bestätige..."
                      : "Deadline bestätigen"}
                  </Button>
                )}

                {canRejectProposal && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectOpen(true)}
                    disabled={rejectExtension.isPending}
                  >
                    Ablehnen
                  </Button>
                )}

                {canCancelProposal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      cancelExtension.mutate(id);
                    }}
                    disabled={cancelExtension.isPending}
                  >
                    {cancelExtension.isPending
                      ? "Storniere..."
                      : "Vorschlag stornieren"}
                  </Button>
                )}

                {!canConfirmProposal &&
                  !canRejectProposal &&
                  !canCancelProposal && (
                    <span className="text-sm text-muted-foreground">
                      Wartet auf Bestätigung durch die Gegenpartei.
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interesse bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie wirklich Ihr Interesse an diesem Auftrag übermitteln?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                expressInterest.mutate(id);
                setConfirmOpen(false);
              }}
            >
              Interesse senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeadlineExtensionModal
        open={extendOpen}
        onOpenChange={setExtendOpen}
        loading={proposeExtension.isPending}
        onSubmit={(iso) => {
          proposeExtension.mutate({ orderId: id, newDeadlineIso: iso });
          setExtendOpen(false);
        }}
      />

      <DeadlineExtensionRejectionModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        loading={rejectExtension.isPending}
        proposedDeadline={proposal?.proposedDeadline || ""}
        onSubmit={(rejectionReason) => {
          rejectExtension.mutate({ orderId: id, rejectionReason });
          setRejectOpen(false);
        }}
      />
    </ScrollArea>
  );
}
