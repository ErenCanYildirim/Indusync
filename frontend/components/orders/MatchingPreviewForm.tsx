"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Search,
  Loader2,
  Clock,
  Building,
  Award,
  Shield,
  Wrench,
  ChevronRight,
} from "lucide-react";
import {
  AddressAutocomplete,
  GeoapifyAddress,
} from "@/components/ui/address-autocomplete";
import { parseGeoapifyAddress } from "@/lib/utils/address-utils";
import {
  industryCategories,
  placementTypes,
  verificationOptions,
  certificationOptions,
  URGENCY_OPTIONS,
  actual_specializations,
  type Specialization,
  type IndustryCategory,
  type UrgencyOption,
} from "@/lib/constants/form-options";
import { useTranslations } from "next-intl";

// Simplified form data for matching preview
export interface MatchingPreviewFormData {
  // Location (core for matching)
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  searchRadiusKm: number;
  isUnlimitedRadius: boolean;

  // Core matching criteria
  targetIndustries: string[];
  placementTypes: string[];
  requiredSpecializations: string[];
  requiredCertifications: string[];
  requiredVerifications: string[];

  // Optional filters
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: Date;
  deadline?: Date;
  budget?: number;
}

interface MatchingPreviewFormProps {
  onSubmit: (data: MatchingPreviewFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<MatchingPreviewFormData>;
}

interface SpecializationSelectorProps {
  specializations: Specialization[];
  selectedSpecializations: string[];
  expandedSpecializations: string[];
  onSpecializationChange: (id: string) => void;
  onToggleSpecialization: (id: string) => void;
  idPrefix?: string;
  level?: number;
}

const SpecializationSelector = ({
  specializations,
  selectedSpecializations,
  expandedSpecializations,
  onSpecializationChange,
  onToggleSpecialization,
  idPrefix = "spec",
  level = 0,
}: SpecializationSelectorProps) => {
  if (level === 0) {
    return (
      <div className="space-y-1 border rounded-lg divide-y">
        {specializations.map((spec: Specialization) => (
          <div key={spec.id} className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onToggleSpecialization(spec.id)}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${idPrefix}-${spec.id}`}
                  checked={selectedSpecializations.includes(spec.id)}
                  onCheckedChange={() => onSpecializationChange(spec.id)}
                />
                <label
                  htmlFor={`${idPrefix}-${spec.id}`}
                  className="text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {spec.name}
                </label>
              </div>
              {spec.subCategories && spec.subCategories.length > 0 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSpecializations.includes(spec.id) && "rotate-90"
                  )}
                />
              )}
            </div>

            {spec.subCategories &&
              spec.subCategories.length > 0 &&
              expandedSpecializations.includes(spec.id) && (
                <div className="ml-6 mt-2 space-y-1">
                  <SpecializationSelector
                    specializations={spec.subCategories}
                    selectedSpecializations={selectedSpecializations}
                    expandedSpecializations={expandedSpecializations}
                    onSpecializationChange={onSpecializationChange}
                    onToggleSpecialization={onToggleSpecialization}
                    idPrefix={`${idPrefix}-${spec.id}`}
                    level={level + 1}
                  />
                </div>
              )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {specializations.map((spec: Specialization) => {
        const hasSubCategories =
          spec.subCategories && spec.subCategories.length > 0;
        const subCategories = spec.subCategories || [];
        return (
          <div key={spec.id} className="space-y-1">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() =>
                hasSubCategories && onToggleSpecialization(spec.id)
              }
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${idPrefix}-${spec.id}`}
                  checked={selectedSpecializations.includes(spec.id)}
                  onCheckedChange={() => onSpecializationChange(spec.id)}
                />
                <label
                  htmlFor={`${idPrefix}-${spec.id}`}
                  className="text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {spec.name}
                </label>
              </div>
              {hasSubCategories && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSpecializations.includes(spec.id) && "rotate-90"
                  )}
                />
              )}
            </div>

            {hasSubCategories && expandedSpecializations.includes(spec.id) && (
              <div className="ml-6 mt-1 space-y-1">
                <SpecializationSelector
                  specializations={subCategories}
                  selectedSpecializations={selectedSpecializations}
                  expandedSpecializations={expandedSpecializations}
                  onSpecializationChange={onSpecializationChange}
                  onToggleSpecialization={onToggleSpecialization}
                  idPrefix={`${idPrefix}-${spec.id}`}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Industry Selector Component (copied from project creation stepper)
interface IndustrySelectorProps {
  industryCategories: IndustryCategory[];
  selectedIndustries: string[];
  expandedCategories: string[];
  customIndustry?: string;
  onIndustryChange: (industryId: string) => void;
  onCustomIndustryChange: (value: string) => void;
  onToggleCategory: (categoryId: string) => void;
  idPrefix?: string;
}

const IndustrySelector = ({
  industryCategories,
  selectedIndustries,
  expandedCategories,
  customIndustry,
  onIndustryChange,
  onCustomIndustryChange,
  onToggleCategory,
  idPrefix = "industry",
}: IndustrySelectorProps) => {
  return (
    <div className="space-y-1 border rounded-lg divide-y">
      {industryCategories.map((category) => (
        <div key={category.id} className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => onToggleCategory(category.id)}
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${idPrefix}-${category.id}`}
                checked={selectedIndustries.includes(category.id)}
                onCheckedChange={() => onIndustryChange(category.id)}
              />
              <label
                htmlFor={`${idPrefix}-${category.id}`}
                className="text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {category.label}
              </label>
            </div>
            {category.subcategories && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expandedCategories.includes(category.id) && "rotate-90"
                )}
              />
            )}
          </div>
          {category.subcategories &&
            expandedCategories.includes(category.id) && (
              <div className="ml-6 mt-2 space-y-1">
                {category.subcategories.map((subcat) => (
                  <div key={subcat.id}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => onToggleCategory(subcat.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${idPrefix}-${subcat.id}`}
                          checked={selectedIndustries.includes(subcat.id)}
                          onCheckedChange={() => onIndustryChange(subcat.id)}
                        />
                        <label
                          htmlFor={`${idPrefix}-${subcat.id}`}
                          className="text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {subcat.label}
                        </label>
                      </div>
                      {subcat.subcategories && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            expandedCategories.includes(subcat.id) &&
                              "rotate-90"
                          )}
                        />
                      )}
                    </div>
                    {subcat.subcategories &&
                      expandedCategories.includes(subcat.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {subcat.subcategories.map((subsubcat) => (
                            <div
                              key={subsubcat.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`${idPrefix}-${subsubcat.id}`}
                                checked={selectedIndustries.includes(
                                  subsubcat.id
                                )}
                                onCheckedChange={() =>
                                  onIndustryChange(subsubcat.id)
                                }
                              />
                              <label
                                htmlFor={`${idPrefix}-${subsubcat.id}`}
                                className="text-sm"
                              >
                                {subsubcat.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          {category.id === "other" && selectedIndustries.includes("custom") && (
            <div className="ml-8 mt-2">
              <Input
                placeholder="Branche eingeben"
                value={customIndustry || ""}
                onChange={(e) => onCustomIndustryChange(e.target.value)}
                className="max-w-md"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const MatchingPreviewForm: React.FC<MatchingPreviewFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData = {},
}) => {
  const t = useTranslations("Dashboard.orders");
  const [formData, setFormData] = useState<MatchingPreviewFormData>({
    street: "",
    city: "",
    postalCode: "",
    country: "Deutschland",
    latitude: 0,
    longitude: 0,
    searchRadiusKm: 50,
    isUnlimitedRadius: false,
    targetIndustries: [],
    placementTypes: [],
    requiredSpecializations: [],
    requiredCertifications: [],
    requiredVerifications: [],
    urgency: "MEDIUM",
    ...initialData,
  });

  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const [expandedSpecializations, setExpandedSpecializations] = useState<
    string[]
  >([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [customIndustry, setCustomIndustry] = useState<string>("");

  const handleInputChange = (
    field: keyof MatchingPreviewFormData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (address: GeoapifyAddress) => {
    const parsed = parseGeoapifyAddress(address);
    setFormData((prev) => ({
      ...prev,
      street: parsed.street || "",
      city: parsed.city || "",
      postalCode: parsed.postalCode || "",
      country: parsed.country || "Deutschland",
      latitude: parsed.latitude || 0,
      longitude: parsed.longitude || 0,
    }));
    setHasSelectedAddress(true);
  };

  const handleArrayFieldChange = (
    field: keyof MatchingPreviewFormData,
    value: string
  ) => {
    setFormData((prev) => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleIndustryChange = (industryId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetIndustries: prev.targetIndustries.includes(industryId)
        ? prev.targetIndustries.filter((id) => id !== industryId)
        : [...prev.targetIndustries, industryId],
    }));
  };

  const handleCustomIndustryChange = (value: string) => {
    setCustomIndustry(value);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleRadiusChange = (value: number[]) => {
    const radius = value[0];
    setFormData((prev) => ({
      ...prev,
      searchRadiusKm: radius,
      isUnlimitedRadius: radius >= 300,
    }));
  };

  const getRadiusDisplayText = () => {
    if (formData.isUnlimitedRadius) return " (Unbegrenzt)";
    return ` (${formData.searchRadiusKm} km)`;
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isFormValid = () => {
    return (
      formData.city &&
      formData.targetIndustries.length > 0 &&
      formData.placementTypes.length > 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Matching-Vorschau
        </h2>
        <p className="text-gray-600">
          Finden Sie passende Dienstleister für Ihr Projekt
        </p>
      </div>

      {/* Location Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Standort & Suchradius
        </h3>

        <div className="space-y-4">
          <div>
            <AddressAutocomplete
              label="Projektstandort *"
              placeholder="Stadt oder Adresse eingeben..."
              value={`${formData.street} ${formData.city}`.trim()}
              onAddressSelect={handleAddressSelect}
              onInputChange={(value) => {
                handleInputChange("street", value);
                setHasSelectedAddress(false);
              }}
            />
            {hasSelectedAddress && (
              <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                <MapPin className="h-4 w-4" />
                <span>Standort erkannt</span>
              </div>
            )}
          </div>

          <div>
            <Label>Suchradius {getRadiusDisplayText()}</Label>
            <Slider
              value={[formData.searchRadiusKm]}
              max={310}
              step={10}
              onValueChange={handleRadiusChange}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 km</span>
              <span>150 km</span>
              <span>Unbegrenzt</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Industry Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Branche *
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Wählen Sie die relevanten Branchen für diesen Auftrag.
        </p>

        <IndustrySelector
          industryCategories={industryCategories}
          selectedIndustries={formData.targetIndustries}
          expandedCategories={expandedCategories}
          customIndustry={customIndustry}
          onIndustryChange={handleIndustryChange}
          onCustomIndustryChange={handleCustomIndustryChange}
          onToggleCategory={toggleCategory}
        />
      </Card>

      {/* Placement Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Vertragsart *
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Bitte wählen Sie die Art der Vermittlung des Auftrages aus.
        </p>

        <div className="space-y-3">
          {placementTypes.map((type) => (
            <div
              key={type.id}
              className={cn(
                "flex items-start p-3 rounded-lg border transition-colors",
                formData.placementTypes.includes(type.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-gray-50"
              )}
            >
              <Checkbox
                id={`placement-${type.id}`}
                checked={formData.placementTypes.includes(type.id)}
                onCheckedChange={() =>
                  handleArrayFieldChange("placementTypes", type.id)
                }
                className="mt-1"
              />
              <div className="ml-3">
                <Label
                  htmlFor={`placement-${type.id}`}
                  className="font-medium text-sm"
                >
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Specializations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Spezialisierungen
        </h3>

        <SpecializationSelector
          specializations={actual_specializations}
          selectedSpecializations={formData.requiredSpecializations}
          expandedSpecializations={expandedSpecializations}
          onSpecializationChange={(id) =>
            handleArrayFieldChange("requiredSpecializations", id)
          }
          onToggleSpecialization={(id) =>
            setExpandedSpecializations((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            )
          }
        />
      </Card>

      {/* Certifications & Verifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Zertifizierungen
          </h3>

          <div className="space-y-2">
            {certificationOptions.map((cert) => (
              <div key={cert.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cert-${cert.id}`}
                  checked={formData.requiredCertifications.includes(cert.id)}
                  onCheckedChange={() =>
                    handleArrayFieldChange("requiredCertifications", cert.id)
                  }
                />
                <Label htmlFor={`cert-${cert.id}`} className="text-sm">
                  {cert.label}
                </Label>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Verifizierungen
          </h3>

          <div className="space-y-2">
            {verificationOptions.map((verif) => (
              <div key={verif.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`verif-${verif.id}`}
                  checked={formData.requiredVerifications.includes(verif.id)}
                  onCheckedChange={() =>
                    handleArrayFieldChange("requiredVerifications", verif.id)
                  }
                />
                <Label htmlFor={`verif-${verif.id}`} className="text-sm">
                  {verif.label}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Urgency */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t("urgency")}
        </h3>

        <RadioGroup
          value={formData.urgency}
          onValueChange={(value) => handleInputChange("urgency", value)}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {URGENCY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`urgency-${option.value}`}
              />
              <Label htmlFor={`urgency-${option.value}`} className="text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
          size="lg"
          className="px-8 py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("matchingRunning")}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {t("startMatching")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MatchingPreviewForm;
