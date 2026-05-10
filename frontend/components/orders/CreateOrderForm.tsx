"use client";

/**
 * Create Order Form Component - Integrated with Geoapify Address Autocomplete
 * Streamlined form for creating new orders with validation and location services
 * Aligned with backend CreateOrderRequest requirements
 *
 * @author IndusSync Frontend Team
 * @since Integration Update
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Loader2,
  Save,
  Send,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useCreateDraftOrder, usePublishOrder } from "@/lib/hooks/useOrders";
import { toast } from "sonner";
import {
  AddressAutocomplete,
  GeoapifyAddress,
} from "@/components/ui/address-autocomplete";
import { parseGeoapifyAddress } from "@/lib/utils/address-utils";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface CreateOrderFormProps {
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

// Order category options aligned with backend enum
const orderCategoryOptions = [
  { value: "NEW_CONSTRUCTION", label: "Neubauprojekt" },
  { value: "REPAIRS", label: "Reparaturen" },
  { value: "MAINTENANCE", label: "Instandhaltung" },
  { value: "EMERGENCY_SERVICE", label: "Notfallservice" },
  { value: "SERVICING", label: "Wartung" },
  { value: "SPECIAL_ORDER", label: "Spezialauftrag" },
  { value: "CONSULTING_PLANNING", label: "Beratung und Planung" },
  { value: "FACILITY_MANAGEMENT", label: "Facility Management" },
  { value: "RENOVATION", label: "Renovierung" },
  { value: "ASSEMBLY", label: "Montage" },
  { value: "OTHER", label: "Sonstiges" },
];

// Industry options aligned with backend enum
const industryOptions = [
  { value: "CONSTRUCTION", label: "Bauwesen" },
  { value: "MANUFACTURING", label: "Verarbeitende Industrie" },
  { value: "ENERGY", label: "Energie" },
  { value: "HEALTHCARE", label: "Gesundheitswesen" },
  { value: "TRANSPORTATION", label: "Transport und Logistik" },
  { value: "TECHNOLOGY", label: "Technologie" },
  { value: "AGRICULTURE", label: "Landwirtschaft" },
  { value: "EDUCATION", label: "Bildungswesen" },
  { value: "FINANCE", label: "Finanzdienstleistungen" },
  { value: "TOURISM", label: "Tourismus" },
  { value: "OTHER", label: "Sonstiges" },
];

// Placement type options aligned with backend enum
const placementTypeOptions = [
  { value: "PROJECT_CONTRACT", label: "Projektvertrag" },
  { value: "TEMPORARY_STAFFING", label: "Zeitarbeit" },
  { value: "CONSULTING", label: "Beratung" },
  { value: "FREELANCE", label: "Freiberuflich" },
  { value: "PERMANENT_PLACEMENT", label: "Festanstellung" },
];

export default function CreateOrderForm({
  onSuccess,
  onCancel,
}: CreateOrderFormProps) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const t = useTranslations("CreateOrderForm");

  // Enhanced validation schema aligned with backend requirements
  const createOrderFormSchema = z.object({
    // Basic information
    title: z.string().min(1, t("validation.titleRequired")),
    description: z.string().min(10, t("validation.descriptionMinLength")),

    // Contact information
    contactName: z.string().min(1, t("validation.contactNameRequired")),
    contactEmail: z.string().email(t("validation.contactEmailInvalid")),
    contactPhone: z.string().min(1, t("validation.contactPhoneRequired")),

    // Location information
    street: z.string().min(1, t("validation.streetRequired")),
    houseNumber: z.string().min(1, t("validation.houseNumberRequired")),
    postalCode: z.string().regex(/^\d{5}$/, t("validation.postalCodeInvalid")),
    city: z.string().min(1, t("validation.cityRequired")),
    country: z.string().default("Deutschland"),
    locationLat: z.number(),
    locationLng: z.number(),
    searchRadiusKm: z
      .number()
      .min(1, t("validation.searchRadiusMin"))
      .max(500, t("validation.searchRadiusMax")),

    // Order details
    primaryCategory: z.string().min(1, t("validation.primaryCategoryRequired")),
    targetIndustries: z
      .array(z.string())
      .min(1, t("validation.targetIndustriesRequired")),
    placementTypes: z
      .array(z.string())
      .min(1, t("validation.placementTypesRequired")),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),

    // Timeline and budget
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    responseTimeHours: z
      .number()
      .min(1, t("validation.responseTimeMin"))
      .max(720, t("validation.responseTimeMax"))
      .optional(),

    // Additional fields
    budget: z.number().positive(t("validation.budgetPositive")).optional(),
    requiredSpecializations: z.array(z.string()).default([]),
    requiredSkills: z.array(z.string()).default([]),
    requiredVerifications: z.array(z.string()).default([]),
    requiredCertifications: z.array(z.string()).default([]),
  });

  type CreateOrderFormData = z.infer<typeof createOrderFormSchema>;

  const createDraftMutation = useCreateDraftOrder();
  const publishMutation = usePublishOrder();

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "Deutschland",
      locationLat: 0,
      locationLng: 0,
      searchRadiusKm: 50,
      primaryCategory: "",
      targetIndustries: [],
      placementTypes: [],
      urgency: "MEDIUM",
      requiredSpecializations: [],
      requiredSkills: [],
      requiredVerifications: [],
      requiredCertifications: [],
    },
  });

  // Handle address selection from Geoapify
  const handleAddressSelect = (address: GeoapifyAddress) => {
    const parsed = parseGeoapifyAddress(address);

    // Update form with parsed address data
    form.setValue("street", parsed.street);
    form.setValue("houseNumber", parsed.houseNumber || "0");
    form.setValue("postalCode", parsed.postalCode);
    form.setValue("city", parsed.city);
    form.setValue("country", parsed.country);
    form.setValue("locationLat", parsed.latitude);
    form.setValue("locationLng", parsed.longitude);

    setHasSelectedAddress(true);
    toast.success("Adresse erfolgreich ausgewählt");
  };

  // Get current location using browser geolocation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation wird von Ihrem Browser nicht unterstützt");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("locationLat", latitude);
        form.setValue("locationLng", longitude);
        toast.success("Standort erfolgreich ermittelt");
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Standort konnte nicht ermittelt werden");
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Submit as draft
  const onSubmitDraft = async (data: CreateOrderFormData) => {
    try {
      // Transform to backend API format
      const orderData = {
        title: data.title,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        searchRadiusKm: data.searchRadiusKm,
        primaryCategory: data.primaryCategory,
        targetIndustries: data.targetIndustries,
        placementTypes: data.placementTypes,
        urgency: data.urgency,
        startDate: data.startDate
          ? new Date(data.startDate).toISOString()
          : undefined,
        deadline: data.endDate
          ? new Date(data.endDate).toISOString()
          : undefined,
        responseTimeHours: data.responseTimeHours,
        budget: data.budget,
        requiredSpecializations: data.requiredSpecializations,
        requiredSkills: data.requiredSkills,
        requiredVerifications: data.requiredVerifications,
        requiredCertifications: data.requiredCertifications,
      };

      const result = await createDraftMutation.mutateAsync(orderData);
      onSuccess?.(result.id);
    } catch (error: any) {
      console.error("Error creating draft:", error);
    }
  };

  // Submit and publish
  const onSubmitPublish = async (data: CreateOrderFormData) => {
    try {
      // First create as draft
      const orderData = {
        title: data.title,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        searchRadiusKm: data.searchRadiusKm,
        primaryCategory: data.primaryCategory,
        targetIndustries: data.targetIndustries,
        placementTypes: data.placementTypes,
        urgency: data.urgency,
        startDate: data.startDate
          ? new Date(data.startDate).toISOString()
          : undefined,
        deadline: data.endDate
          ? new Date(data.endDate).toISOString()
          : undefined,
        responseTimeHours: data.responseTimeHours,
        budget: data.budget,
        requiredSpecializations: data.requiredSpecializations,
        requiredSkills: data.requiredSkills,
        requiredVerifications: data.requiredVerifications,
        requiredCertifications: data.requiredCertifications,
      };

      const draftResult = await createDraftMutation.mutateAsync(orderData);

      // Then publish the draft
      await publishMutation.mutateAsync(draftResult.id);

      onSuccess?.(draftResult.id);
    } catch (error: any) {
      console.error("Error publishing order:", error);
    }
  };

  // Watch form values for progress calculation
  const watchedValues = form.watch();
  const progress = useMemo(() => {
    const requiredFields = [
      "title",
      "description",
      "contactName",
      "contactEmail",
      "contactPhone",
      "street",
      "houseNumber",
      "postalCode",
      "city",
      "primaryCategory",
      "targetIndustries",
      "placementTypes",
    ];

    const filledFields = requiredFields.filter((field) => {
      const value = watchedValues[field as keyof typeof watchedValues];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value.toString().trim() !== "";
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  }, [watchedValues]);

  const { errors, watch } = form.formState;
  const watchedData = watch();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Neuen Auftrag erstellen
          </CardTitle>
          <CardDescription>
            Erstellen Sie einen neuen Auftrag mit automatischer Adresserkennung
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Grundinformationen
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    placeholder="z.B. Elektroinstallation Bürogebäude"
                    {...form.register("title")}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {t("title_error")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Kontaktperson *</Label>
                  <Input
                    id="contactName"
                    placeholder="Max Mustermann"
                    {...form.register("contactName")}
                    className={errors.contactName ? "border-red-500" : ""}
                  />
                  {errors.contactName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {t("contactName_error")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">E-Mail *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="max@beispiel.de"
                    {...form.register("contactEmail")}
                    className={errors.contactEmail ? "border-red-500" : ""}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {t("contactEmail_error")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefon (optional)</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+49 123 456789"
                    {...form.register("contactPhone")}
                    className={errors.contactPhone ? "border-red-500" : ""}
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {t("contactPhone_error")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  placeholder="Detaillierte Beschreibung des Auftrags..."
                  rows={4}
                  {...form.register("description")}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {t("description_error")}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Service Address with Geoapify Integration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Serviceadresse
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <AddressAutocomplete
                    label="Adresse *"
                    placeholder="Straße und Hausnummer eingeben..."
                    value={`${watchedData.street || ""} ${
                      watchedData.houseNumber || ""
                    }`.trim()}
                    onAddressSelect={handleAddressSelect}
                    onInputChange={(value) => {
                      // Handle manual input
                      const parts = value.split(" ");
                      if (parts.length >= 2) {
                        const lastPart = parts[parts.length - 1];
                        if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
                          form.setValue("street", parts.slice(0, -1).join(" "));
                          form.setValue("houseNumber", lastPart);
                        } else {
                          form.setValue("street", value);
                          form.setValue("houseNumber", "");
                        }
                      } else {
                        form.setValue("street", value);
                        form.setValue("houseNumber", "");
                      }
                    }}
                    error={!!(errors.street || errors.houseNumber)}
                    errorMessage={
                      errors.street?.message || errors.houseNumber?.message
                    }
                    className="mb-4"
                  />

                  {hasSelectedAddress && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Adresse mit GPS-Koordinaten erkannt</span>
                    </div>
                  )}
                </div>

                {/* Manual address fields (auto-filled by Geoapify) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">PLZ *</Label>
                    <Input
                      id="postalCode"
                      placeholder="12345"
                      {...form.register("postalCode")}
                      className={errors.postalCode ? "border-red-500" : ""}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-red-500">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt *</Label>
                    <Input
                      id="city"
                      placeholder="Berlin"
                      {...form.register("city")}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      {...form.register("country")}
                      className={errors.country ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="searchRadiusKm">Suchradius (km) *</Label>
                    <Input
                      id="searchRadiusKm"
                      type="number"
                      min="1"
                      max="1000"
                      {...form.register("searchRadiusKm", {
                        valueAsNumber: true,
                      })}
                      className={errors.searchRadiusKm ? "border-red-500" : ""}
                    />
                    {errors.searchRadiusKm && (
                      <p className="text-sm text-red-500">
                        {errors.searchRadiusKm.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Current Location Button */}
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    Aktuellen Standort verwenden
                  </Button>

                  {watchedData.locationLat !== 0 &&
                    watchedData.locationLng !== 0 && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        GPS-Koordinaten verfügbar
                      </Badge>
                    )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Categories & Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Kategorien & Klassifizierung
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryCategory">Auftragskategorie *</Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue("primaryCategory", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.primaryCategory ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.primaryCategory && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {t("primaryCategory_error")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Dringlichkeit</Label>
                  <Select
                    defaultValue="MEDIUM"
                    onValueChange={(value) =>
                      form.setValue(
                        "urgency",
                        value as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Niedrig</SelectItem>
                      <SelectItem value="MEDIUM">Mittel</SelectItem>
                      <SelectItem value="HIGH">Hoch</SelectItem>
                      <SelectItem value="URGENT">Sehr Dringend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ziel-Branchen * (mindestens eine auswählen)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {industryOptions.map((industry) => (
                    <Button
                      key={industry.value}
                      type="button"
                      variant={
                        watchedData.targetIndustries?.includes(industry.value)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="justify-start h-auto py-2"
                      onClick={() => {
                        const current = watchedData.targetIndustries || [];
                        const updated = current.includes(industry.value)
                          ? current.filter((i) => i !== industry.value)
                          : [...current, industry.value];
                        form.setValue("targetIndustries", updated);
                      }}
                    >
                      {industry.label}
                    </Button>
                  ))}
                </div>
                {errors.targetIndustries && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {t("targetIndustries_error")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Auftragsarten * (mindestens eine auswählen)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {placementTypeOptions.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={
                        watchedData.placementTypes?.includes(type.value)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="justify-start h-auto py-2"
                      onClick={() => {
                        const current = watchedData.placementTypes || [];
                        const updated = current.includes(type.value)
                          ? current.filter((p) => p !== type.value)
                          : [...current, type.value];
                        form.setValue("placementTypes", updated);
                      }}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
                {errors.placementTypes && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {t("placementTypes_error")}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Timeline & Budget (Optional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Zeitplan & Budget (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Deadline</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("budget", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseTimeHours">Antwortzeit (Stunden)</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("responseTimeHours", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gewünschte Antwortzeit wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 Stunden</SelectItem>
                    <SelectItem value="48">48 Stunden</SelectItem>
                    <SelectItem value="72">72 Stunden</SelectItem>
                    <SelectItem value="168">1 Woche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={
                  createDraftMutation.isPending || publishMutation.isPending
                }
              >
                Abbrechen
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(onSubmitDraft)}
                  disabled={createDraftMutation.isPending}
                >
                  {createDraftMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Als Entwurf speichern
                </Button>

                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmitPublish)}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Erstellen & Veröffentlichen
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
