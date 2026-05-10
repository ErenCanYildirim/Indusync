"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useOrder,
  useUpdateOrder,
  usePublishOrder,
  useUploadOrderDocument,
} from "@/lib/hooks/useOrders";
import { getProjectById, Project } from "@/lib/projects-service";
import { ProjectCreationStepper } from "@/components/project-creation-stepper";
import { mapOrderDetailToProjectFormData } from "@/lib/utils/mapOrderDetailToProjectFormData";
import { ProjectFormData } from "@/hooks/use-project-creation";

// Helper function to check if ID is a UUID
function isUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export default function OrderEditPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const isBackendOrder = isUUID(orderId);

  // State for mock data handling
  const [mockProject, setMockProject] = useState<Project | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const [projectFormData, setProjectFormData] =
    useState<ProjectFormData | null>(null);

  // Backend API hooks (only used for UUID orders)
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId, isBackendOrder);
  const updateOrderMutation = useUpdateOrder();
  const publishOrderMutation = usePublishOrder();
  const uploadDocumentMutation = useUploadOrderDocument();

  // Handle mock project loading
  useEffect(() => {
    if (!isBackendOrder) {
      const loadMockProject = async () => {
        try {
          setMockLoading(true);
          const projectId = parseInt(orderId, 10);
          if (isNaN(projectId)) {
            setMockError("Ungültige Projekt-ID");
            return;
          }

          const project = await getProjectById(projectId);
          setMockProject(project);

          if (!project) {
            setMockError("Projekt nicht gefunden");
          }
        } catch (error) {
          setMockError("Fehler beim Laden des Projekts");
          console.error("Error loading mock project:", error);
        } finally {
          setMockLoading(false);
        }
      };

      loadMockProject();
    }
  }, [orderId, isBackendOrder]);

  // Handle backend order data and convert to ProjectFormData
  useEffect(() => {
    if (isBackendOrder && order && !orderLoading) {
      // Check if order can be edited
      if (order.status && order.status !== "DRAFT") {
        toast.error("Nur Entwürfe können bearbeitet werden");
        router.push(`/dashboard/auftraege/${orderId}`);
        return;
      }

      try {
        // Convert backend order to ProjectFormData using the mapping function
        const formData = mapOrderDetailToProjectFormData(order);
        setProjectFormData(formData);
      } catch (error) {
        console.error("Error mapping order data:", error);
        toast.error("Fehler beim Laden der Auftragsdaten");
      }
    }
  }, [order, orderLoading, orderId, router, isBackendOrder]);

  // Handle mock project data conversion
  useEffect(() => {
    if (!isBackendOrder && mockProject) {
      // Convert mock project to ProjectFormData format for the stepper
      const formData: ProjectFormData = {
        projectName: mockProject.title || "",
        contactPersons: [
          {
            id: "1",
            name: "",
            email: "",
            phone: "",
          },
        ],
        orderCategories: [],
        selectedIndustries: [],
        placementTypes: [],
        documents: [],
        verifications: [],
        certifications: [],
        specializations: [],
        selectedSpecializations: [],
        location: mockProject.location || "",
        street: "",
        houseNumber: "",
        postalCode: "",
        city: mockProject.location || "",
        country: "Deutschland",
        latitude: 0,
        longitude: 0,
        radius: 50,
        isUnlimitedRadius: false,
        startDate: mockProject.startDate
          ? new Date(mockProject.startDate)
          : undefined,
        endDate: mockProject.endDate
          ? new Date(mockProject.endDate)
          : undefined,
        responseTime: "7",
        customResponseDays: undefined,
        customIndustry: undefined,
      };
      setProjectFormData(formData);
    }
  }, [mockProject, isBackendOrder]);

  // Upload documents for an order
  const uploadOrderDocuments = async (
    orderId: string,
    documents: File[]
  ): Promise<boolean> => {
    if (!documents || documents.length === 0) {
      return true; // No documents to upload
    }

    try {
      const uploadPromises = documents.map(async (file) => {
        return uploadDocumentMutation.mutateAsync({
          orderId,
          file,
          documentType: "ATTACHMENT",
          description: `Projektdokument: ${file.name}`,
        });
      });

      await Promise.all(uploadPromises);
      return true;
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw new Error("Fehler beim Hochladen der Dokumente");
    }
  };

  // Handle save function for both draft and publish
  const handleSave = async (
    formData: ProjectFormData,
    shouldPublish: boolean = false
  ) => {
    if (isBackendOrder) {
      // Handle backend order update using the existing update hook
      try {
        const primaryContact = formData.contactPersons[0] || {
          name: "",
          email: "",
          phone: "",
        };

        // Map frontend industry values to German display names
        const mapIndustryToGermanName = (frontendValue: string): string => {
          const mapping: { [key: string]: string } = {
            "plant-engineering": "Maschinenbau",
            healthcare: "Krankenhäuser",
            "agriculture-resources": "Sonstiges",
            mining: "Bergbau",
            manufacturing: "Allgemeine Fertigung",
            automotive: "Automobilindustrie",
            "mechanical-engineering": "Maschinenbau",
            chemical: "Chemische Industrie",
            electrical: "Elektronikindustrie",
            metal: "Stahl- und Metallindustrie",
            "food-beverage": "Lebensmittel und Getränke",
            pharmaceutical: "Pharmaindustrie",
            construction: "Bauwesen",
            energy: "Energieerzeugung",
            "renewable-energy": "Erneuerbare Energien",
            transportation: "Transport und Logistik",
            other: "Sonstiges",
          };
          return mapping[frontendValue] || "Allgemeine Fertigung";
        };

        // Map frontend placement types to German display names
        const mapPlacementTypeToGermanName = (
          frontendValue: string
        ): string => {
          const mapping: { [key: string]: string } = {
            public: "Werkvertrag",
            private: "Dienstleistungsvertrag",
            direct: "Direktvermittlung",
          };
          return mapping[frontendValue] || "Werkvertrag";
        };

        // Transform ProjectFormData back to CreateOrderRequest format for update
        const updateData = {
          // Basic information
          title: formData.projectName,
          description: `Auftrag: ${
            formData.projectName
          }. Kategorien: ${formData.orderCategories.join(
            ", "
          )}. Industrien: ${formData.selectedIndustries.join(", ")}.`,

          // Contact information
          contactName: primaryContact.name,
          contactEmail: primaryContact.email,
          contactPhone: primaryContact.phone,

          // Service address
          street: formData.street,
          houseNumber: formData.houseNumber,
          postalCode: formData.postalCode,
          city: formData.city,
          country: formData.country,

          // Geographic coordinates
          locationLat: formData.latitude,
          locationLng: formData.longitude,
          searchRadiusKm: formData.isUnlimitedRadius ? 1000 : formData.radius,

          // Categories & classification
          primaryCategory: formData.orderCategories[0] || "OTHER",
          additionalCategories: formData.orderCategories.slice(1),
          targetIndustries:
            formData.selectedIndustries.length > 0
              ? formData.selectedIndustries.map(mapIndustryToGermanName)
              : ["Sonstiges"],
          placementTypes:
            formData.placementTypes.length > 0
              ? formData.placementTypes.map(mapPlacementTypeToGermanName)
              : ["Werkvertrag"],

          // Skills & requirements
          requiredSpecializations: formData.selectedSpecializations,
          requiredSkills: [], // Can be extended later
          requiredVerifications: formData.verifications,
          requiredCertifications: formData.certifications,

          // Timeline & urgency
          urgency: "MEDIUM" as const, // Default urgency
          startDate: formData.startDate
            ? formData.startDate.toISOString()
            : undefined,
          deadline: formData.endDate
            ? formData.endDate.toISOString()
            : undefined,
          responseTimeHours: formData.responseTime
            ? parseInt(formData.responseTime) * 24
            : 168, // Convert days to hours

          // Financial (can be extended later)
          budget: undefined,
        };

        // First, update the order with the changes
        await updateOrderMutation.mutateAsync({
          orderId,
          orderData: updateData,
        });

        // Upload documents if any
        if (formData.documents && formData.documents.length > 0) {
          try {
            await uploadOrderDocuments(orderId, formData.documents);
          } catch (uploadError) {
            // Don't fail the update if document upload fails
            console.warn("Document upload failed:", uploadError);
            toast.warning(
              "Auftrag gespeichert, aber Dokumente konnten nicht hochgeladen werden"
            );
          }
        }

        // If shouldPublish is true, also publish the order
        if (shouldPublish) {
          await publishOrderMutation.mutateAsync(orderId);
        }

        toast.success(
          shouldPublish
            ? "Auftrag erfolgreich veröffentlicht!"
            : "Auftrag erfolgreich gespeichert!"
        );
        router.push(`/dashboard/auftraege/${orderId}`);
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Fehler beim Aktualisieren des Auftrags");
        throw error;
      }
    } else {
      // Handle mock project "edit" (show read-only message)
      toast.error(
        "Demo-Projekte können derzeit nicht bearbeitet werden. Erstellen Sie einen neuen Auftrag für vollständige Bearbeitungsmöglichkeiten."
      );
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/dashboard/auftraege/${orderId}`);
  };

  // Determine loading state
  const isLoading = isBackendOrder ? orderLoading : mockLoading;
  const hasError = isBackendOrder ? orderError : mockError;
  const currentData = isBackendOrder ? order : mockProject;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">
          {isBackendOrder
            ? "Auftrag wird geladen..."
            : "Projekt wird geladen..."}
        </span>
      </div>
    );
  }

  if (hasError || !currentData) {
    return (
      <div className="text-center text-destructive py-8">
        <p>
          {isBackendOrder
            ? "Auftrag konnte nicht geladen werden"
            : "Projekt konnte nicht geladen werden"}
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/auftraege")}
        >
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  // Show notice for mock projects and render stepper
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notice for mock projects */}
      {!isBackendOrder && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-700">
              <strong>Hinweis:</strong> Dies ist ein Demo-Projekt aus den
              Beispieldaten. Die Stepper-Ansicht wird angezeigt, aber Änderungen
              können nicht gespeichert werden.
            </p>
          </div>
        </div>
      )}

      {/* Render the ProjectCreationStepper with edit mode */}
      {projectFormData && (
        <ProjectCreationStepper
          isEditMode={true}
          editOrderId={orderId}
          initialData={projectFormData}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
