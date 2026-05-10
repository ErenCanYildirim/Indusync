"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useProjectCreation,
  ProjectFormData,
} from "@/hooks/use-project-creation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Upload,
  X,
  Plus,
  FileText,
  CheckCircle,
  MapPin,
  Info,
  ClipboardCheck,
  ArrowLeft,
  LucideIcon,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  AddressAutocomplete,
  GeoapifyAddress,
} from "@/components/ui/address-autocomplete";
import { parseGeoapifyAddress } from "@/lib/utils/address-utils";
import Link from "next/link"; // Ensure Link is imported
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { de } from "date-fns/locale/de";
import { CommonDatePicker } from "@/components/ui/date-picker";
import { useTranslations } from "next-intl";
registerLocale("de", de);
setDefaultLocale("de");

// Add specialization interfaces
interface Specialization {
  id: string;
  name: string;
  subCategories?: Specialization[];
  subcategories?: Specialization[];
}

interface SpecializationSelectorProps {
  specializations: Specialization[];
  selectedSpecializations: string[];
  expandedSpecializations: string[];
  onSpecializationChange: (specializationId: string) => void;
  onToggleSpecialization: (specializationId: string) => void;
  idPrefix?: string;
  level?: number;
}

// Add the actual specializations data
const actual_specializations = [
  {
    id: "elektrotechnik",
    name: "Elektrotechnik",
    subCategories: [
      { id: "datentechnik", name: "Datentechnik" },
      { id: "automatisierungstechnik", name: "Automatisierungstechnik" },
      { id: "antriebstechnik", name: "Antriebstechnik" },
      { id: "schaltschrankbau", name: "Schaltschrankbau" },
      { id: "beleuchtungstechnik", name: "Beleuchtungstechnik" },
      {
        id: "programmierung",
        name: "Programmierung",
        subCategories: [
          { id: "sps", name: "SPS" },
          { id: "knx", name: "KNX" },
          { id: "dasy", name: "DASY" },
          { id: "logo", name: "LOGO" },
          { id: "scada", name: "SCADA-Systeme" },
        ],
      },
      {
        id: "energietechnik",
        name: "Energietechnik",
        subCategories: [
          { id: "elektrospeicher", name: "Elektrospeicher" },
          { id: "ladestation", name: "Ladestationen" },
        ],
      },
      { id: "kommunikationstechnik", name: "Kommunikationstechnik" },
      { id: "gebäudetechnik", name: "Gebäudetechnik" },
      { id: "regelungstechnik", name: "Regelungstechnik" },
      { id: "messtechnik", name: "Messtechnik" },
      { id: "mikrosystemtechnik", name: "Mikrosystemtechnik" },
      { id: "hochfrequenztechnik", name: "Hochfrequenztechnik" },
      { id: "sensortechnik", name: "Sensortechnik" },
      {
        id: "erneuerbare_energien",
        name: "Erneuerbare Energien",
        subCategories: [
          { id: "wind", name: "Wind" },
          { id: "solar", name: "Solar" },
          { id: "wasserkraft", name: "Wasserkraft" },
          { id: "ladestationen", name: "Ladestationen" },
        ],
      },
      { id: "kabelverlegung", name: "Kabelverlegung" },
      { id: "kraftwerkstechnik", name: "Kraftwerkstechnik" },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "mechatronik",
    name: "Mechatronik",
    subCategories: [
      { id: "robotik", name: "Robotik" },
      { id: "hydraulik", name: "Hydraulik" },
      { id: "pneumatik", name: "Pneumatik" },
      { id: "sensortechnik", name: "Sensortechnik" },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "mechanik",
    name: "Mechanik / Stahlbau",
    subCategories: [
      { id: "maschinenbau", name: "Maschinenbau" },
      { id: "anlagenbau", name: "Anlagenbau" },
      { id: "blechbearbeitung", name: "Blechbearbeitung" },
      { id: "stahlbau/Metallbau", name: "Stahlbau/Metallbau" },
      { id: "schweißen", name: "Schweißen" },
      { id: "oberfläche", name: "Oberfläche (Lackieren, Beschichten)" },
      { id: "zerspannungstechnik", name: "Zerspannungstechnik" },
      { id: "fluidtechnik", name: "Fluidtechnik" },
      { id: "thermodynamik", name: "Thermodynamik" },
      { id: "industriekletterer", name: "Industriekletterer" },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "maler_tapezierer_lackierer",
    name: "Maler, Tapezierer & Lackierer",
    subCategories: [
      {
        id: "maler",
        name: "Maler",
        subcategories: [
          { id: "innenraummaler", name: "Innenraummaler" },
          { id: "fasadenmaler", name: "Fasadenmaler" },
          { id: "dekorationsmaler", name: "Dekorationsmaler" },
          { id: "denkmalschutzmaler", name: "Denkmalschutzmaler" },
          { id: "industriemaler", name: "Industriemaler" },
        ],
      },
      {
        id: "lackierer",
        name: "Lackierer",
        subcategories: [
          { id: "fahrzeuglackierer", name: "Fahrzeuglackierer" },
          { id: "industrielackierer", name: "Industrielackierer" },
          { id: "möbellackierer", name: "Möbellackierer" },
          {
            id: "korrosionsschutzlackierer",
            name: "Korrosionsschutzlackierer",
          },
          { id: "pulverbeschichter", name: "Pulverbeschichter" },
        ],
      },
      {
        id: "tapezierer",
        name: "Tapezierer",
        subcategories: [
          { id: "wandtapeten", name: "Wandtapeten" },
          {
            id: "dekorative_wandverkleidungen",
            name: "Dekorative Wandverkleidungen",
          },
          { id: "textiltapezierer", name: "Textiltapezierer" },
          { id: "glasfasertapeten", name: "Glasfasertapeten" },
          { id: "spezialtapeten", name: "Spezialtapeten" },
        ],
      },
    ],
  },
  {
    id: "sanitärtechnik_heizsysteme",
    name: "Sanitärtechnik & Heizsysteme",
    subcategories: [
      {
        id: "sanitärtechnik",
        name: "Sanitärtechnik",
        subcategories: [
          { id: "trinkwasserversorung", name: "Trinkwasserversorgung" },
          { id: "gasinstallation", name: "Gasinstallation" },
          { id: "sanitäre_einrichtunge", name: "Sanitäre Einrichtungen" },
          { id: "wasseraufbereitung", name: "Wasseraufbereitung" },
          { id: "rohrverlegung", name: "Trinkwasserversorgung" },
          { id: "trinkwasserversorung", name: "Trinkwasserversorgung" },
        ],
      },
      {
        id: "heizsysteme",
        name: "Heizsysteme",
        subcategories: [
          { id: "zentralheizung", name: "Zentralheizung" },
          { id: "fußbodenheizung", name: "Fußbodenheizung" },
          { id: "wärmepumpen", name: "Wärmepumpen" },
          { id: "solarthermie", name: "Solarthermie" },
          { id: "fernwärme", name: "Fernwärme" },
          { id: "pelletheizung", name: "Pelletheizung" },
          { id: "gasheizung", name: "Gasheizung" },
          { id: "ölheizung", name: "Ölheizung" },
          { id: "infrarotheizung", name: "Infrarotheizung" },
        ],
      },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "trockenbau",
    name: "Trockenbau",
    subcategories: [
      {
        id: "wand_und_deckenbekleidung",
        name: "Wand- und Deckenbekleidung",
      },
      { id: "trennwände", name: "Trennwände" },
      { id: "schallschutz", name: "Schallschutz" },
      { id: "brandschutz", name: "Brandschutz" },
      { id: "dämmung", name: "Dämmung" },
      { id: "deckenabhängung", name: "" },
      { id: "bodenbeläge", name: "Bodenbeläge" },
      { id: "trockenputz", name: "Trockenputz" },
      { id: "akustik", name: "Akustidecken & -wände" },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "maurerarbeiten",
    name: "Maurerarbeiten",
    subcategories: [
      { id: "fundament_grundmauer", name: "Fundament & Grundmauer" },
      { id: "wände_trennwände", name: "Wände & Trennwände" },
      { id: "kamine_schornsteine", name: "Kamine & Schornsteine" },
      { id: "gewölbe_bogen", name: "Gewölbe & Bögen" },
      { id: "verputzarbeiten", name: "Verputzarbeiten" },
      { id: "treppenbau", name: "Treppenbau" },
      { id: "außenanlagen", name: "Außenanlagen" },
      { id: "sanierung_restaurierung", name: "Sanierung & Restaurierung" },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "gerätetechnik",
    name: "Gerätetechnik",
    subcategories: [
      { id: "kuchengeräte", name: "Küchengeräte" },
      { id: "haushaltsgeräte", name: "Haushaltsgeräte" },
      { id: "elektrowerkzeuge", name: "Elektrowerkzeuge" },
      { id: "medizinische_geräte", name: "Medizinische Geräte" },
      { id: "unterhaltungselektronik", name: "Unterhaltungselektronik" },
      { id: "telekommunikationsgeräte", name: "Telekommunikationsgeräte" },
      { id: "garten_outdoor_geräte", name: "Garten-/Outdoor-Geräte" },
      { id: "büro_geräte", name: "Büro-Geräte" },
      { id: "klimatechnik_lüftung", name: "Klimatechnik & Lüftung" },
      { id: "mess_prüfgeräte", name: "Mess- & Prüfgeräte" },
      { id: "home_automation", name: "Smart Home & Home Automation" },
      {
        id: "industrielle_geräte",
        name: "Industrielle Geräte",
        subcategories: [
          { id: "förderbänder", name: "Förderbänder" },
          { id: "roboter", name: "Roboter" },
          { id: "produktionsmaschinen", name: "Produktionsmaschinen" },
        ],
      },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "brandschutz",
    name: "Brandschutz",
    subcategories: [
      {
        id: "präventiver_brandschutz",
        name: "Präventiver Brandschutz",
        subcategories: [
          { id: "baulich", name: "Baulicher Branschutz" },
          {
            id: "anlagentechnisch",
            name: "Anlagentechnischer Brandschutz",
          },
          { id: "organisatorisch", name: "Organisatorischer Brandschutz" },
          { id: "brandabschottung", name: "Brandabschottung" },
        ],
      },
      { id: "feuerlöschsysteme", name: "Feuerlöschsysteme" },
      {
        id: "einsatzorte",
        name: "Einsatzorte",
        subcategories: [
          { id: "industrieanlagen", name: "Industrieanlagen" },
          { id: "historische_gebäude", name: "Historische Gebäude" },
          { id: "wohnungsbau", name: "Wohnungsbau" },
          { id: "verkehr", name: "Verkehr (Züge, Flugzeuge, Schiffe" },
        ],
      },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
  {
    id: "umzüge_logistik",
    name: "Umzüge & Logistik",
    subcategories: [
      {
        id: "privatumzüge",
        name: "Privatumzüge",
        subcategories: [
          { id: "lokal", name: "Lokale Umzüge" },
          { id: "national", name: "Nationale Umzüge" },
          { id: "international", name: "Internationale Umzüge" },
          { id: "miet_lkw_service", name: "Miet-LKW-Service" },
        ],
      },
      {
        id: "gewerbeumzüge",
        name: "Gewerbeumzüge",
        subcategories: [
          { id: "büro", name: "Büro-Umzüge" },
          { id: "industrie_fabrik", name: "Industrie- & Fabrikumzüge" },
          { id: "server", name: "Server- & Rechenzentrumsumzüge" },
          { id: "labor", name: "Labor- & Bibliotheksumzüge" },
        ],
      },
      {
        id: "messe_event",
        name: "Messe- & Eventlogistik",
        subcategories: [
          { id: "messauf_abbau", name: "Messeauf- & Abbau" },
          { id: "event_service", name: "Event-Service" },
        ],
      },
      {
        id: "entsorgung_recycling",
        name: "Entsorgung & Recycling",
        subcategories: [
          { id: "möbelentsorgung", name: "Möbelentsorgung" },
          {
            id: "elektroschrott_recycling",
            name: "Elektroschrott-Recycling",
          },
          { id: "baustellenentsorgung", name: "Baustellenentsorgung" },
        ],
      },
      { id: "schwer_spezial", name: "Schwer- & Spezialtransporte" },
      { id: "sonderleistung", name: "Sonderleistung" },
    ],
  },
];

// Component for specialization selector
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
        {specializations.map((spec) => (
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
              {((spec.subCategories && spec.subCategories.length > 0) ||
                (spec.subcategories && spec.subcategories.length > 0)) && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSpecializations.includes(spec.id) && "rotate-90"
                  )}
                />
              )}
            </div>

            {((spec.subCategories && spec.subCategories.length > 0) ||
              (spec.subcategories && spec.subcategories.length > 0)) &&
              expandedSpecializations.includes(spec.id) && (
                <div className="ml-6 mt-2 space-y-1">
                  <SpecializationSelector
                    specializations={
                      spec.subCategories || spec.subcategories || []
                    }
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
      {specializations.map((spec) => {
        const hasSubCategories =
          (spec.subCategories && spec.subCategories.length > 0) ||
          (spec.subcategories && spec.subcategories.length > 0);
        const subCategories = spec.subCategories || spec.subcategories || [];

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

interface Step {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface IndustryCategory {
  id: string;
  label: string;
  subcategories?: {
    id: string;
    label: string;
    subcategories?: {
      id: string;
      label: string;
    }[];
  }[];
}

interface FormData {
  projectName: string;
  contactPersons: ContactPerson[];
  orderCategories: string[];
  selectedIndustries: string[];
  customIndustry?: string;
  placementTypes: string[];
  documents: File[];
  verifications: string[];
  certifications: string[];
  specializations: string[];
  selectedSpecializations: string[];
  location: string;
  // Enhanced address fields for backend integration
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  radius: number;
  isUnlimitedRadius: boolean;
  startDate?: Date;
  endDate?: Date;
  responseTime: string;
  customResponseDays?: string;
}

interface UploadedFileType {
  id: number;
  name: string;
  size: string;
  fileObject?: File; // Optional: to store the actual file object if needed later
}

interface ProjectCreationStepperProps {
  currentStep?: number;
  initialData?: ProjectFormData;
  isEditMode?: boolean;
  editOrderId?: string;
  onSave?: (
    formData: ProjectFormData,
    shouldPublish?: boolean
  ) => Promise<void>;
  onCancel?: () => void;
}

// Component for Industry Selection
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

// Component for Contact Person Fields
interface ContactPersonFieldsProps {
  person: ContactPerson;
  index: number;
  total: number;
  onContactChange: (
    id: string,
    field: keyof Omit<ContactPerson, "id">,
    value: string
  ) => void;
  onRemove: (id: string) => void;
}

const ContactPersonFields = ({
  person,
  index,
  total,
  onContactChange,
  onRemove,
}: ContactPersonFieldsProps) => {
  const t = useTranslations("Dashboard.orders");
  return (
    <div className="border rounded-lg p-4 space-y-4 relative">
      {total > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(person.id)}
          className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <div>
        <Label htmlFor={`contactPerson-${person.id}`}>
          {t("contactPerson")} {index + 1}
        </Label>
        <Input
          id={`contactPerson-${person.id}`}
          value={person.name}
          onChange={(e) => onContactChange(person.id, "name", e.target.value)}
          placeholder={t("contactNamePlaceholder")}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`contactEmail-${person.id}`}>
            {t("contactEmail")}
          </Label>
          <Input
            id={`contactEmail-${person.id}`}
            type="email"
            value={person.email}
            onChange={(e) =>
              onContactChange(person.id, "email", e.target.value)
            }
            placeholder={t("contactEmailPlaceholder")}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`contactPhone-${person.id}`}>
            {t("contactPhone")}
          </Label>
          <Input
            id={`contactPhone-${person.id}`}
            value={person.phone}
            onChange={(e) =>
              onContactChange(person.id, "phone", e.target.value)
            }
            placeholder={t("contactPhonePlaceholder")}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

// Component for OrderCategories selection
interface OrderCategoriesProps {
  categories: { id: string; label: string }[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string) => void;
}

const OrderCategoriesSelector = ({
  categories,
  selectedCategories,
  onCategoryChange,
}: OrderCategoriesProps) => {
  const t = useTranslations("Dashboard.orders");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center space-x-2"
          suppressHydrationWarning
        >
          <Checkbox
            id={`category-${category.id}`}
            checked={selectedCategories.includes(category.id)}
            onCheckedChange={() => onCategoryChange(category.id)}
          />
          <label
            htmlFor={`category-${category.id}`}
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {category.label}
          </label>
        </div>
      ))}
    </div>
  );
};

// Component for file upload
interface FileUploaderProps {
  uploadedFiles: UploadedFileType[];
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: number) => void;
}

const FileUploader = ({
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
}: FileUploaderProps) => {
  const t = useTranslations("Dashboard.orders");

  return (
    <>
      <div className="border-2 border-dashed rounded-lg p-6 text-center mb-6 hover:border-primary transition-colors">
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="mb-3 text-sm font-medium">{t("dragFilesHere")}</p>

        <Button asChild variant="outline" size="sm">
          <label htmlFor="file-upload" className="cursor-pointer">
            Dateien auswählen
          </label>
        </Button>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={onFileUpload}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          PDF, DOC, DOCX, XLS, XLSX, JPG, PNG bis zu 10MB pro Datei
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium mb-2">Hochgeladene Dateien</h3>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-md border"
            >
              <div className="flex items-center min-w-0">
                <FileText className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
                <span className="text-sm truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  ({file.size})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveFile(file.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// Step 1: Project Information Component
interface ProjectInformationProps {
  projectName: string;
  contactPersons: ContactPerson[];
  orderCategories: string[];
  onProjectNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onContactPersonChange: (
    id: string,
    field: keyof Omit<ContactPerson, "id">,
    value: string
  ) => void;
  onAddContactPerson: () => void;
  onRemoveContactPerson: (id: string) => void;
  onOrderCategoryChange: (categoryId: string) => void;
  orderCategoryOptions: { id: string; label: string }[];
  validationErrors?: { [key: string]: string };
}

const ProjectInformation = ({
  projectName,
  contactPersons,
  orderCategories,
  onProjectNameChange,
  onContactPersonChange,
  onAddContactPerson,
  onRemoveContactPerson,
  onOrderCategoryChange,
  orderCategoryOptions,
  validationErrors,
}: ProjectInformationProps) => {
  const t = useTranslations("Dashboard.orders");
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">{t("basicInformation")}</h2>
      <div className="space-y-6">
        <div>
          <Label htmlFor="projectName">{t("title")}</Label>
          <Input
            id="projectName"
            name="projectName"
            value={projectName}
            onChange={onProjectNameChange}
            placeholder={t("titlePlaceholder")}
            className="mt-1"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">{t("contactPerson")}</h3>
            {contactPersons.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddContactPerson}
                className="flex items-center text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("addContactPerson")}
              </Button>
            )}
          </div>
          {contactPersons.map((person, index) => (
            <ContactPersonFields
              key={person.id}
              person={person}
              index={index}
              total={contactPersons.length}
              onContactChange={onContactPersonChange}
              onRemove={onRemoveContactPerson}
            />
          ))}
        </div>
        <div className="pt-2">
          <h3 className="text-md font-medium mb-3">{t("orderCategory")}</h3>
          <OrderCategoriesSelector
            categories={orderCategoryOptions}
            selectedCategories={orderCategories}
            onCategoryChange={onOrderCategoryChange}
          />
        </div>
      </div>
    </Card>
  );
};

// Step 2: Location & Time Component
interface LocationTimeProps {
  location: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  radius: number;
  isUnlimitedRadius: boolean;
  startDate?: Date;
  endDate?: Date;
  responseTime: string;
  customResponseDays?: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddressSelect: (address: GeoapifyAddress) => void;
  onSliderChange: (value: number[]) => void;
  onDateChange: (
    date: Date | null,
    field: keyof Pick<FormData, "startDate" | "endDate">
  ) => void;
  onRadioChange: (
    value: string,
    field: keyof Pick<FormData, "responseTime">
  ) => void;
  onCustomResponseDaysChange: (value: string) => void;
  responseTimeOptions: { id: string; label: string }[];
  getRadiusDisplayText: () => string;
}

const LocationTime = ({
  location,
  street,
  houseNumber,
  postalCode,
  city,
  country,
  latitude,
  longitude,
  radius,
  startDate,
  endDate,
  responseTime,
  customResponseDays,
  onInputChange,
  onAddressSelect,
  onSliderChange,
  onDateChange,
  onRadioChange,
  onCustomResponseDaysChange,
  responseTimeOptions,
  getRadiusDisplayText,
}: LocationTimeProps) => {
  const t = useTranslations("Dashboard.orders");
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const handleAddressSelect = (address: GeoapifyAddress) => {
    onAddressSelect(address);
    setHasSelectedAddress(true);
  };
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        {t("locationAndTime")}
      </h2>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <AddressAutocomplete
              label={t("addressLabel")}
              placeholder={t("addressPlaceholder")}
              value={`${street || ""} ${houseNumber || ""}`.trim()}
              onAddressSelect={handleAddressSelect}
              onInputChange={(value) => {
                // Handle manual input - try to parse street and house number
                const parts = value.split(" ");
                if (parts.length >= 2) {
                  const lastPart = parts[parts.length - 1];
                  if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
                    // Last part looks like a house number
                    onInputChange({
                      target: {
                        name: "street",
                        value: parts.slice(0, -1).join(" "),
                      },
                    } as ChangeEvent<HTMLInputElement>);
                    onInputChange({
                      target: { name: "houseNumber", value: lastPart },
                    } as ChangeEvent<HTMLInputElement>);
                  } else {
                    onInputChange({
                      target: { name: "street", value: value },
                    } as ChangeEvent<HTMLInputElement>);
                  }
                } else {
                  onInputChange({
                    target: { name: "street", value: value },
                  } as ChangeEvent<HTMLInputElement>);
                }
                // Also update the legacy location field
                onInputChange({
                  target: { name: "location", value: value },
                } as ChangeEvent<HTMLInputElement>);
              }}
              className="mb-4"
            />
            {hasSelectedAddress && latitude !== 0 && longitude !== 0 && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>{t("addressSelected")}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="postalCode">{t("postalCode")}</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={postalCode}
                onChange={onInputChange}
                placeholder={t("postalCodePlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">{t("city")}</Label>
              <Input
                id="city"
                name="city"
                value={city}
                onChange={onInputChange}
                placeholder={t("cityPlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">{t("country")}</Label>
              <Input
                id="country"
                name="country"
                value={country}
                onChange={onInputChange}
                placeholder={t("countryPlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("gpsCoordinates")}</Label>
              <div className="text-sm text-gray-500 mt-1">
                {latitude !== 0 && longitude !== 0
                  ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : t("notAvailable")}
              </div>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="radius">
            {t("maxDistance")} {getRadiusDisplayText()}
          </Label>
          <Slider
            id="radius"
            defaultValue={[radius]}
            max={310}
            step={10}
            onValueChange={onSliderChange}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0 km</span>
            <span>150 km</span>
            <span>{t("unlimited")}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">{t("startDate")}</Label>
            <CommonDatePicker
              value={startDate}
              onChange={(date) => onDateChange(date, "startDate")}
              id="start-date"
            />
          </div>
          <div>
            <Label htmlFor="end-date">{t("deadline")}</Label>
            <CommonDatePicker
              value={endDate}
              onChange={(date) => onDateChange(date, "endDate")}
              id="end-date"
            />
          </div>
        </div>
        <div>
          <Label>{t("responseTime")}</Label>
          <RadioGroup
            value={responseTime}
            onValueChange={(value) => onRadioChange(value, "responseTime")}
            className="mt-2 space-y-1"
          >
            {responseTimeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.id}
                  id={`response-${option.id}`}
                />
                <Label
                  htmlFor={`response-${option.id}`}
                  className="font-normal"
                >
                  {option.label}
                </Label>
                {option.id === "custom" && responseTime === "custom" && (
                  <Input
                    className="ml-2 w-24"
                    type="number"
                    min="1"
                    placeholder={t("daysPlaceholder")}
                    value={customResponseDays}
                    onChange={(e) => onCustomResponseDaysChange(e.target.value)}
                  />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </Card>
  );
};

// Step 3: Requirements Component
interface RequirementsProps {
  verifications: string[];
  certifications: string[];
  selectedIndustries: string[];
  placementTypes: string[];
  expandedCategories: string[];
  customIndustry?: string;
  industryCategories: IndustryCategory[];
  verificationOptions: { id: string; label: string }[];
  certificationOptions: { id: string; label: string }[];
  placementTypesOptions: {
    id: string;
    label: string;
    description: string;
  }[];
  selectedSpecializations: string[];
  expandedSpecializations: string[];
  onCheckboxChange: (
    id: string,
    field: keyof Pick<
      FormData,
      "verifications" | "certifications" | "specializations"
    >
  ) => void;
  onIndustryChange: (industryId: string) => void;
  onCustomIndustryChange: (value: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onPlacementTypeChange: (typeId: string) => void;
  onSpecializationChange: (specializationId: string) => void;
  onToggleSpecialization: (specializationId: string) => void;
}

const Requirements = ({
  verifications,
  certifications,
  selectedIndustries,
  placementTypes,
  expandedCategories,
  customIndustry,
  industryCategories,
  verificationOptions,
  certificationOptions,
  placementTypesOptions,
  selectedSpecializations,
  expandedSpecializations,
  onCheckboxChange,
  onIndustryChange,
  onCustomIndustryChange,
  onToggleCategory,
  onPlacementTypeChange,
  onSpecializationChange,
  onToggleSpecialization,
}: RequirementsProps) => {
  const t = useTranslations("Dashboard.orders");
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">{t("requirementsTitle")}</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium mb-3">{t("verifications")}</h3>
          <div className="space-y-2">
            {verificationOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`verification-${option.id}`}
                  checked={verifications.includes(option.id)}
                  onCheckedChange={() => {
                    onCheckboxChange(option.id, "verifications");
                  }}
                />
                <label
                  htmlFor={`verification-${option.id}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium mb-3">{t("certifications")}</h3>
          <div className="space-y-2">
            {certificationOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`certification-${option.id}`}
                  checked={certifications.includes(option.id)}
                  onCheckedChange={() => {
                    onCheckboxChange(option.id, "certifications");
                  }}
                />
                <label
                  htmlFor={`certification-${option.id}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              {t("addCertification")}
            </Button>
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium mb-3">
            {t("specializationsTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("specializationsDescription")}
          </p>
          <div className="border rounded-lg p-4">
            <SpecializationSelector
              specializations={actual_specializations}
              selectedSpecializations={selectedSpecializations}
              expandedSpecializations={expandedSpecializations}
              onSpecializationChange={onSpecializationChange}
              onToggleSpecialization={onToggleSpecialization}
            />
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium mb-3">{t("industrySelection")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("industrySelectionDescription")}
          </p>
          <IndustrySelector
            industryCategories={industryCategories}
            selectedIndustries={selectedIndustries}
            expandedCategories={expandedCategories}
            customIndustry={customIndustry}
            onIndustryChange={onIndustryChange}
            onCustomIndustryChange={onCustomIndustryChange}
            onToggleCategory={onToggleCategory}
          />
        </div>
        <div>
          <h3 className="text-md font-medium mb-3">
            {t("placementTypeTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("placementTypeDescription")}
          </p>
          <div className="space-y-4">
            {placementTypesOptions.map((type) => (
              <div
                key={type.id}
                className={cn(
                  "relative flex items-start p-4 rounded-lg border transition-colors",
                  placementTypes.includes(type.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center h-5">
                  <Checkbox
                    id={`placement-${type.id}`}
                    checked={placementTypes.includes(type.id)}
                    onCheckedChange={() => onPlacementTypeChange(type.id)}
                  />
                </div>
                <div className="ml-3">
                  <Label
                    htmlFor={`placement-${type.id}`}
                    className="font-medium text-sm cursor-pointer"
                  >
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Step 4: Documents Component
interface DocumentsProps {
  uploadedFiles: UploadedFileType[];
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: number) => void;
}

const Documents = ({
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
}: DocumentsProps) => {
  const t = useTranslations("Dashboard.orders");

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Dokumente hochladen</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium mb-3">Dokumente</h3>
          <FileUploader
            uploadedFiles={uploadedFiles}
            onFileUpload={onFileUpload}
            onRemoveFile={onRemoveFile}
          />
        </div>
      </div>
    </Card>
  );
};

// Step 5: Review Component
interface ReviewProps {
  formData: FormData;
  uploadedFiles: UploadedFileType[];
  orderCategoryOptions: { id: string; label: string }[];
  verificationOptions: { id: string; label: string }[];
  certificationOptions: { id: string; label: string }[];
  responseTimeOptions: { id: string; label: string }[];
  industryCategories: IndustryCategory[];
  placementTypes: { id: string; label: string; description: string }[];
  dateRange: string;
}

const Review = ({
  formData,
  uploadedFiles,
  orderCategoryOptions,
  verificationOptions,
  certificationOptions,
  responseTimeOptions,
  industryCategories,
  placementTypes,
  dateRange,
}: ReviewProps) => {
  const t = useTranslations("Dashboard.orders");
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">{t("reviewAndSubmit")}</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium mb-2">{t("basicInformation")}</h3>
          <div className="bg-gray-50 p-4 rounded-md border">
            <dl className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-gray-600">
                  {t("title")}
                </dt>
                <dd className="text-sm sm:col-span-2 text-gray-800">
                  {formData.projectName || t("notProvided")}
                </dd>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-gray-600">
                  {t("orderCategory")}
                </dt>
                <dd className="text-sm sm:col-span-2 text-gray-800">
                  {formData.orderCategories.length > 0
                    ? formData.orderCategories
                        .map(
                          (categoryId) =>
                            orderCategoryOptions.find(
                              (opt) => opt.id === categoryId
                            )?.label
                        )
                        .join(", ")
                    : t("notProvided")}
                </dd>
              </div>
              {formData.contactPersons.map((person, index) => (
                <div key={person.id} className="space-y-1">
                  <dt className="text-sm font-medium text-gray-600">
                    {t("contactPerson")} {index + 1}:
                  </dt>
                  <dd className="text-sm sm:col-span-2 text-gray-800 ml-4">
                    {person.name || t("notProvided")}
                    {person.email && ` | ${person.email}`}
                    {person.phone && ` | ${person.phone}`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium mb-2">{t("documents")}</h3>
          <div className="bg-gray-50 p-4 rounded-md border">
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-1">
                {uploadedFiles.map((file) => (
                  <li key={file.id} className="text-sm text-gray-800">
                    {file.name} ({file.size})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noDocumentsUploaded")}
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium mb-2">{t("requirementsTitle")}</h3>
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-600">
                  {t("verifications")}
                </h4>
                {formData.verifications.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {formData.verifications.map((id) => (
                      <li key={id} className="text-sm text-gray-800">
                        {
                          verificationOptions.find((opt) => opt.id === id)
                            ?.label
                        }
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("noneSelected")}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">
                  {t("certifications")}
                </h4>
                {formData.certifications.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {formData.certifications.map((id) => (
                      <li key={id} className="text-sm text-gray-800">
                        {
                          certificationOptions.find((opt) => opt.id === id)
                            ?.label
                        }
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("noneSelected")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium mb-2">{t("locationAndTime")}</h3>
          <div className="bg-gray-50 p-4 rounded-md border">
            <dl className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-gray-600">
                  {t("addressLabel")}
                </dt>
                <dd className="text-sm sm:col-span-2 text-gray-800">
                  {formData.location || t("notProvided")}
                </dd>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-gray-600">
                  {t("maxDistance")}
                </dt>
                <dd className="text-sm sm:col-span-2 text-gray-800">
                  {formData.isUnlimitedRadius
                    ? t("unlimited")
                    : `${formData.radius} km`}
                </dd>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-gray-600">
                  {t("projectPeriod")}
                </dt>
                <dd className="text-sm sm:col-span-2 text-gray-800">
                  {dateRange}
                </dd>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-gray-600">
                  {t("responseTime")}
                </dt>
                <dd className="text-sm sm:col-span-2 text-gray-800">
                  {formData.responseTime === "custom"
                    ? `${formData.customResponseDays ?? "0"} ${t("days")}`
                    : responseTimeOptions.find(
                        (opt) => opt.id === formData.responseTime
                      )?.label ?? ""}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
          <dt className="text-sm font-medium text-gray-600">
            {t("industries")}
          </dt>
          <dd className="text-sm sm:col-span-2 text-gray-800">
            {formData.selectedIndustries.length > 0
              ? formData.selectedIndustries
                  .map((id) => {
                    const findCategory = (
                      categories: IndustryCategory[]
                    ): string | undefined => {
                      for (const cat of categories) {
                        if (cat.id === id) return cat.label;
                        if (cat.subcategories) {
                          const found = findCategory(cat.subcategories);
                          if (found) return found;
                        }
                      }
                      return undefined;
                    };
                    return findCategory(industryCategories) || id;
                  })
                  .concat(
                    formData.customIndustry ? [formData.customIndustry] : []
                  )
                  .join(", ")
              : t("notProvided")}
          </dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
          <dt className="text-sm font-medium text-gray-600">
            {t("placementTypeTitle")}
          </dt>
          <dd className="text-sm sm:col-span-2 text-gray-800">
            {formData.placementTypes.length > 0
              ? formData.placementTypes
                  .map(
                    (typeId) =>
                      placementTypes.find((type) => type.id === typeId)?.label
                  )
                  .join(", ")
              : t("notProvided")}
          </dd>
        </div>
        <div className="pt-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" className="mt-0.5" />
            <label
              htmlFor="terms"
              className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("confirmAllCorrect")}
              <Link href="/agb" className="text-primary hover:underline mx-1">
                {t("terms")}
              </Link>
              {t("and")}
              <Link
                href="/datenschutz"
                className="text-primary hover:underline ml-1"
              >
                {t("privacyPolicy")}
              </Link>
              {t("agreeTo")}
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Stepper Navigation Component
interface StepperNavigationProps {
  steps: Step[];
  currentStep: number;
  goToStep: (step: number) => void;
}

const StepperNavigation = ({
  steps,
  currentStep,
  goToStep,
}: StepperNavigationProps) => {
  const getStepIconTextColor = (index: number, currentStep: number) => {
    if (index === currentStep) return "text-primary";
    if (index < currentStep) return "text-primary";
    return "text-gray-400 group-hover:text-gray-500";
  };

  const getStepIconClassName = (index: number, currentStep: number) => {
    if (index === currentStep) {
      return "border-primary ring-2 ring-primary ring-offset-2";
    }
    if (index < currentStep) {
      return "border-primary bg-primary-lightest";
    }
    return "border-gray-300 group-hover:border-gray-400";
  };

  const getStepLabelColor = (index: number, currentStep: number) => {
    if (index === currentStep) return "text-primary";
    if (index < currentStep) return "text-primary";
    return "text-gray-500 group-hover:text-gray-700";
  };

  const getStepNameColor = (index: number, currentStep: number) => {
    if (index === currentStep) return "text-gray-900 font-semibold";
    if (index < currentStep) return "text-gray-700";
    return "text-gray-400 group-hover:text-gray-500";
  };

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden md:block">
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon; // Get the icon component for the current step
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "relative flex flex-col items-center focus:outline-none group",
                    index <= currentStep ? "text-primary" : "text-gray-500",
                    index > currentStep
                      ? "cursor-not-allowed"
                      : "hover:text-primary-dark"
                  )}
                  disabled={index > currentStep && index !== currentStep} // More precise disabling
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white",
                      getStepIconClassName(index, currentStep)
                    )}
                  >
                    <StepIcon
                      className={cn(
                        "h-5 w-5",
                        getStepIconTextColor(index, currentStep)
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium text-center w-28 truncate",
                      getStepLabelColor(index, currentStep)
                    )}
                  >
                    Schritt {index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-xs text-center w-28 truncate",
                      getStepNameColor(index, currentStep)
                    )}
                  >
                    {step.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white",
                "border-primary text-primary"
              )}
            >
              {steps[currentStep] &&
                React.createElement(steps[currentStep].icon, {
                  className: "h-5 w-5",
                })}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-primary">
                Schritt {currentStep + 1} von {steps.length}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {steps[currentStep]?.name}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {currentStep + 1}/{steps.length}
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Footer Navigation Component
interface FooterNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSaveClose: () => void;
  onSubmit: () => void;
  onSubmitAndPublish: () => void;
  onCancel?: () => void;
  router: any;
  isSubmitting?: boolean;
  error?: string | null;
}

const FooterNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSaveClose,
  onSubmit,
  onSubmitAndPublish,
  onCancel,
  router,
  isSubmitting = false,
  error,
}: FooterNavigationProps) => {
  const t = useTranslations("Dashboard.orders");
  return (
    <div className="mt-10 pt-6 border-t flex flex-col gap-4">
      {/* Error display */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {currentStep === 0 ? (
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={currentStep === 0 || isSubmitting}
            >
              {t("back")}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onCancel || (() => router.push("/dashboard/auftraege"))}
            className="text-gray-700 hover:text-gray-900"
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onSaveClose}
            className="text-primary border-primary hover:bg-primary/10"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("saving") : t("saveAndClose")}
          </Button>
          {currentStep < totalSteps - 1 ? (
            <Button onClick={onNext} size="lg" disabled={isSubmitting}>
              {t("next")}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onSubmit}
                size="lg"
                disabled={isSubmitting}
                className="text-primary border-primary hover:bg-primary/10"
              >
                {isSubmitting ? t("saving") : t("saveAsDraft")}
              </Button>
              <Button
                onClick={onSubmitAndPublish}
                size="lg"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? t("publishing") : t("createAndPublish")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Validation message component
interface ValidationMessageProps {
  error?: string;
  className?: string;
}

const ValidationMessage = ({
  error,
  className = "",
}: ValidationMessageProps) => {
  if (!error) return null;

  return (
    <div className={`flex items-center mt-1 text-red-600 text-sm ${className}`}>
      <AlertTriangle className="h-4 w-4 mr-1" />
      <span>{error}</span>
    </div>
  );
};

export function ProjectCreationStepper({
  currentStep: initialStep = 0,
  initialData,
  isEditMode = false,
  editOrderId,
  onSave,
  onCancel,
}: Readonly<ProjectCreationStepperProps>) {
  const t = useTranslations("Dashboard.orders");

  const steps: Step[] = [
    {
      id: "step-1",
      name: t("stepProjectInfo"),
      icon: Info,
    },
    {
      id: "step-2",
      name: t("stepLocationTime"),
      icon: MapPin,
    },
    {
      id: "step-3",
      name: t("stepRequirements"),
      icon: ClipboardCheck,
    },
    {
      id: "step-4",
      name: t("stepDocuments"),
      icon: FileText,
    },
    {
      id: "step-5",
      name: t("stepReview"),
      icon: CheckCircle,
    },
  ];

  const router = useRouter();
  const {
    createProject,
    saveDraft,
    createAndPublishProject,
    isSubmitting,
    error,
    clearError,
    validateStep,
    validationErrors,
  } = useProjectCreation();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const orderCategoryOptions = [
    { id: "CONSTRUCTION", label: t("newConstruction") },
    { id: "MAINTENANCE", label: t("maintenance") },
    { id: "EMERGENCY_REPAIR", label: t("emergencyService") },
    { id: "CONSULTING", label: t("consulting") },
    { id: "MECHANICAL_ENGINEERING", label: t("mechanicalEngineering") },
    { id: "ELECTRICAL_WORK", label: t("electricalWork") },
    { id: "PLUMBING", label: t("plumbing") },
    { id: "HVAC", label: t("hvac") },
    { id: "INDUSTRIAL_CLEANING", label: t("industrialCleaning") },
    { id: "WELDING", label: t("welding") },
    { id: "PAINTING", label: t("painting") },
    { id: "INSULATION", label: t("insulation") },
    { id: "AUTOMATION", label: t("automation") },
    { id: "INSTRUMENTATION", label: t("instrumentation") },
    { id: "SAFETY_INSPECTION", label: t("safetyInspection") },
    { id: "CRANE_OPERATION", label: t("craneOperation") },
    { id: "SCAFFOLDING", label: t("scaffolding") },
    { id: "CONFINED_SPACE", label: t("confinedSpace") },
    { id: "HEIGHT_WORK", label: t("heightWork") },
    { id: "SHUTDOWN_MAINTENANCE", label: t("shutdownMaintenance") },
    { id: "OTHER", label: t("other") },
  ];

  const industryCategories: IndustryCategory[] = [
    {
      id: "plant-engineering",
      label: t("plantEngineering"),
    },
    {
      id: "healthcare",
      label: t("healthcare"),
    },
    {
      id: "agriculture-resources",
      label: t("agricultureResources"),
      subcategories: [
        { id: "agriculture-forestry", label: t("agricultureForestry") },
        { id: "mining", label: t("mining") },
      ],
    },
    {
      id: "manufacturing",
      label: t("manufacturing"),
      subcategories: [
        { id: "automotive", label: t("automotive") },
        {
          id: "mechanical-engineering",
          label: t("mechanicalEngineeringIndustry"),
        },
        { id: "chemical", label: t("chemical") },
        { id: "electrical", label: t("electrical") },
        { id: "metal", label: t("metal") },
        { id: "plastics", label: t("plastics") },
        { id: "paper-printing", label: t("paperPrinting") },
        { id: "textile-clothing", label: t("textileClothing") },
        { id: "food-beverage", label: t("foodBeverage") },
        { id: "pharmaceutical", label: "Pharmazeutische Industrie" },
        { id: "medical-technology", label: "Medizintechnik" },
        { id: "agricultural-technology", label: "Agrartechnik" },
      ],
    },
    {
      id: "construction-infrastructure",
      label: "Bauwesen und Infrastruktur",
      subcategories: [
        {
          id: "construction",
          label: "Bauwesen",
          subcategories: [
            { id: "building-construction", label: "Hochbau" },
            { id: "civil-engineering", label: "Tiefbau" },
          ],
        },
        { id: "shipbuilding", label: "Schiffbau und maritime Industrie" },
      ],
    },
    {
      id: "energy-environment",
      label: "Energie und Umwelt",
      subcategories: [
        { id: "energy", label: "Energie und Umwelt" },
        { id: "renewable-energy", label: "Erneuerbare Energien" },
        { id: "environmental-technology", label: "Umwelttechnik" },
      ],
    },
    {
      id: "services-trade",
      label: "Dienstleistungen und Handel",
      subcategories: [
        { id: "retail", label: "Einzelhandel" },
        { id: "logistics-transport", label: "Logistik und Transport" },
        { id: "tourism-hospitality", label: "Tourismus und Gastgewerbe" },
        { id: "financial-services", label: "Finanzdienstleistungen" },
        { id: "education", label: "Bildungswesen" },
        { id: "creative-industry", label: "Kreativwirtschaft" },
        { id: "sports-leisure", label: "Sport und Freizeit" },
        { id: "recycling", label: "Recyclingindustrie" },
      ],
    },
    {
      id: "technology-innovation",
      label: "Technologie und Innovation",
      subcategories: [
        {
          id: "ict",
          label: "Informations- und Kommunikationstechnologie (IKT)",
        },
        { id: "biotechnology", label: "Biotechnologie" },
        { id: "aerospace", label: "Luft- und Raumfahrtindustrie" },
        { id: "research-development", label: "Forschung und Entwicklung" },
      ],
    },
    {
      id: "other",
      label: "Sonstiges",
      subcategories: [{ id: "custom", label: "Individuelle Eingabe" }],
    },
  ];

  const placementTypes = [
    {
      id: "public",
      label: "Öffentliche Ausschreibung",
      description:
        "Die gesamte Plattform kann Ihren Auftrag einsehen, sodass mehrere Dienstleister Ihnen ein Angebot unterbreiten und Sie kontaktieren können.",
    },
    {
      id: "private",
      label: "Verschlossene Ausschreibung",
      description:
        "Bei einer verschlossenen Ausschreibung können Sie gezielt einzelne Unternehmen von der Teilnahme ausschließen, während alle übrigen die Ausschreibung erhalten.",
    },
    {
      id: "direct",
      label: "Direktvermittlung",
      description:
        "Bei der Direktvermittlung haben Sie die Möglichkeit, gezielt mehrere Unternehmen auszuwählen, denen Sie den Auftrag zur Einsicht freigeben.",
    },
  ];

  // Convert initialData to FormData format if provided
  const getInitialFormData = (): FormData => {
    if (initialData && isEditMode) {
      return {
        projectName: initialData.projectName || "",
        contactPersons:
          initialData.contactPersons.length > 0
            ? initialData.contactPersons.map((cp, idx) => ({
                id: `${idx + 1}`,
                ...cp,
              }))
            : [{ id: "1", name: "", email: "", phone: "" }],
        orderCategories: initialData.orderCategories || [],
        selectedIndustries: initialData.selectedIndustries || [],
        placementTypes: initialData.placementTypes || [],
        documents: [], // Files will be handled separately
        verifications: initialData.verifications || [],
        certifications: initialData.certifications || [],
        specializations: [],
        selectedSpecializations: initialData.selectedSpecializations || [],
        location: `${initialData.street || ""} ${
          initialData.houseNumber || ""
        }, ${initialData.city || ""}`.trim(),
        street: initialData.street || "",
        houseNumber: initialData.houseNumber || "",
        postalCode: initialData.postalCode || "",
        city: initialData.city || "",
        country: initialData.country || "Deutschland",
        latitude: initialData.latitude || 0,
        longitude: initialData.longitude || 0,
        radius: initialData.radius || 50,
        isUnlimitedRadius: initialData.isUnlimitedRadius || false,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        responseTime: initialData.responseTime || "7",
        customResponseDays: "",
      };
    }

    return {
      projectName: "",
      contactPersons: [{ id: "1", name: "", email: "", phone: "" }],
      orderCategories: [],
      selectedIndustries: [],
      placementTypes: [],
      documents: [],
      verifications: [],
      certifications: [],
      specializations: [],
      selectedSpecializations: [],
      location: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "Deutschland",
      latitude: 0,
      longitude: 0,
      radius: 50,
      isUnlimitedRadius: false,
      startDate: undefined,
      endDate: undefined,
      responseTime: "7",
      customResponseDays: "",
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileType[]>([]);

  const verificationOptions = [
    { id: "registered", label: t("registeredCompany") },
    { id: "insured", label: t("liabilityInsurance") },
    { id: "taxId", label: t("taxId") },
    { id: "employees", label: t("employees") },
  ];

  const certificationOptions = [
    { id: "iso9001", label: t("iso9001") },
    { id: "iso14001", label: t("iso14001") },
    { id: "tuv", label: t("tuv") },
    { id: "vds", label: t("vds") },
    { id: "scc", label: t("scc") },
  ];

  const responseTimeOptions = [
    { id: "3", label: t("responseTime3Days") },
    { id: "7", label: t("responseTime7Days") },
    { id: "14", label: t("responseTime14Days") },
    { id: "30", label: t("responseTime30Days") },
    { id: "30+", label: t("responseTimeMore30Days") },
    { id: "custom", label: t("responseTimeCustom") },
  ];

  const [dateRange, setDateRange] = useState("Nicht angegeben");

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedSpecializations, setExpandedSpecializations] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      setDateRange(
        `${format(formData.startDate, "dd.MM.yyyy")} bis ${format(
          formData.endDate,
          "dd.MM.yyyy"
        )}`
      );
    } else {
      setDateRange("Nicht angegeben");
    }
  }, [formData.startDate, formData.endDate]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContactPersonChange = (
    id: string,
    field: keyof Omit<ContactPerson, "id">,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      contactPersons: prev.contactPersons.map((person) =>
        person.id === id ? { ...person, [field]: value } : person
      ),
    }));
  };

  const addContactPerson = () => {
    if (formData.contactPersons.length < 5) {
      setFormData((prev) => ({
        ...prev,
        contactPersons: [
          ...prev.contactPersons,
          {
            id: String(prev.contactPersons.length + 1),
            name: "",
            email: "",
            phone: "",
          },
        ],
      }));
    }
  };

  const removeContactPerson = (id: string) => {
    if (formData.contactPersons.length > 1) {
      setFormData((prev) => ({
        ...prev,
        contactPersons: prev.contactPersons.filter(
          (person) => person.id !== id
        ),
      }));
    }
  };

  const handleCheckboxChange = (
    id: string,
    field: keyof Pick<
      FormData,
      "verifications" | "certifications" | "specializations"
    >
  ) => {
    const currentValues = [...formData[field]];
    const index = currentValues.indexOf(id);

    if (index === -1) {
      currentValues.push(id);
    } else {
      currentValues.splice(index, 1);
    }
    setFormData({ ...formData, [field]: currentValues });
  };

  const handleRadioChange = (
    value: string,
    field: keyof Pick<FormData, "responseTime">
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateChange = (
    date: Date | null,
    field: keyof Pick<FormData, "startDate" | "endDate">
  ) => {
    setFormData({ ...formData, [field]: date ?? undefined });
  };

  const handleSliderChange = (value: number[]) => {
    const newRadius = value[0];
    const isUnlimited = newRadius === 310;

    setFormData({
      ...formData,
      radius: newRadius,
      isUnlimitedRadius: isUnlimited,
    });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles: UploadedFileType[] = filesArray.map((file, index) => ({
        id: uploadedFiles.length + index + 1,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        fileObject: file,
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      // Store actual files in formData if needed, e.g., for submission
      setFormData({
        ...formData,
        documents: [...formData.documents, ...filesArray],
      });
    }
  };

  const removeFile = (id: number) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
    // Also remove from formData.documents if you've stored them there by name or another identifier
    const fileToRemove = uploadedFiles.find((f) => f.id === id);
    if (fileToRemove) {
      setFormData({
        ...formData,
        documents: formData.documents.filter(
          (doc) => doc.name !== fileToRemove.name
        ),
      });
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (validateStep(currentStep, formData)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (stepIndex: number) => {
    if (
      stepIndex >= 0 &&
      stepIndex < steps.length &&
      stepIndex <= currentStep
    ) {
      // Allow going to previous/current steps
      setCurrentStep(stepIndex);
    }
  };

  const submitForm = async () => {
    clearError();

    if (isEditMode && onSave) {
      // In edit mode, use the onSave prop to update the existing order
      try {
        await onSave(formData, false); // Save as draft
      } catch (error) {
        console.error("Error saving in edit mode:", error);
      }
    } else {
      // In create mode, use the original creation logic
      const result = await createProject(formData);
      // Navigation is handled inside createProject function
    }
  };

  const submitAndPublish = async () => {
    clearError();

    if (isEditMode && onSave) {
      // In edit mode, use the onSave prop to update and publish the existing order
      try {
        await onSave(formData, true); // Save and publish
      } catch (error) {
        console.error("Error publishing in edit mode:", error);
      }
    } else {
      // In create mode, use the original creation logic
      const result = await createAndPublishProject(formData);
      // Navigation is handled inside createAndPublishProject function
    }
  };

  const saveAndClose = async () => {
    clearError();

    if (isEditMode && onSave) {
      // In edit mode, use the onSave prop to update the existing order
      try {
        await onSave(formData, false); // Save as draft
      } catch (error) {
        console.error("Error saving in edit mode:", error);
      }
    } else {
      // In create mode, use the original creation logic
      const result = await saveDraft(formData);

      // Only navigate if the draft was successfully created
      if (result) {
        router.push("/dashboard/auftraege");
      }
    }
  };

  const getRadiusDisplayText = () => {
    if (formData.isUnlimitedRadius) {
      return `(${t("unlimited")})`;
    }
    return `(${formData.radius} km)`;
  };

  const handleOrderCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      orderCategories: prev.orderCategories.includes(categoryId)
        ? prev.orderCategories.filter((id) => id !== categoryId)
        : [...prev.orderCategories, categoryId],
    }));
  };

  const handleIndustryChange = (industryId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedIndustries: prev.selectedIndustries.includes(industryId)
        ? prev.selectedIndustries.filter((id) => id !== industryId)
        : [...prev.selectedIndustries, industryId],
    }));
  };

  const handleCustomIndustryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      customIndustry: value,
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePlacementTypeChange = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      placementTypes: prev.placementTypes.includes(typeId)
        ? prev.placementTypes.filter((id) => id !== typeId)
        : [...prev.placementTypes, typeId],
    }));
  };

  const handleSpecializationChange = (specializationId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSpecializations: prev.selectedSpecializations.includes(
        specializationId
      )
        ? prev.selectedSpecializations.filter((id) => id !== specializationId)
        : [...prev.selectedSpecializations, specializationId],
    }));
  };

  const toggleSpecialization = (specializationId: string) => {
    setExpandedSpecializations((prev) =>
      prev.includes(specializationId)
        ? prev.filter((id) => id !== specializationId)
        : [...prev, specializationId]
    );
  };

  // Handle address selection from Geoapify
  const handleAddressSelect = (address: GeoapifyAddress) => {
    const parsed = parseGeoapifyAddress(address);

    setFormData((prev) => ({
      ...prev,
      street: parsed.street,
      houseNumber: parsed.houseNumber || "0",
      postalCode: parsed.postalCode,
      city: parsed.city,
      country: parsed.country,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      location: parsed.formattedAddress, // Also update the legacy field
    }));
  };

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <StepperNavigation
        steps={steps}
        currentStep={currentStep}
        goToStep={goToStep}
      />

      {/* Step content */}
      <div className="mt-8">
        {currentStep === 0 && (
          <ProjectInformation
            projectName={formData.projectName}
            contactPersons={formData.contactPersons}
            orderCategories={formData.orderCategories}
            onProjectNameChange={handleInputChange}
            onContactPersonChange={handleContactPersonChange}
            onAddContactPerson={addContactPerson}
            onRemoveContactPerson={removeContactPerson}
            onOrderCategoryChange={handleOrderCategoryChange}
            orderCategoryOptions={orderCategoryOptions}
            validationErrors={validationErrors}
          />
        )}

        {currentStep === 1 && (
          <LocationTime
            location={formData.location}
            street={formData.street}
            houseNumber={formData.houseNumber}
            postalCode={formData.postalCode}
            city={formData.city}
            country={formData.country}
            latitude={formData.latitude}
            longitude={formData.longitude}
            radius={formData.radius}
            isUnlimitedRadius={formData.isUnlimitedRadius}
            startDate={formData.startDate}
            endDate={formData.endDate}
            responseTime={formData.responseTime}
            customResponseDays={formData.customResponseDays}
            onInputChange={handleInputChange}
            onAddressSelect={handleAddressSelect}
            onSliderChange={handleSliderChange}
            onDateChange={handleDateChange}
            onRadioChange={handleRadioChange}
            onCustomResponseDaysChange={(value) =>
              setFormData({ ...formData, customResponseDays: value })
            }
            responseTimeOptions={responseTimeOptions}
            getRadiusDisplayText={getRadiusDisplayText}
          />
        )}

        {currentStep === 2 && (
          <Requirements
            verifications={formData.verifications}
            certifications={formData.certifications}
            selectedIndustries={formData.selectedIndustries}
            placementTypes={formData.placementTypes}
            expandedCategories={expandedCategories}
            customIndustry={formData.customIndustry}
            industryCategories={industryCategories}
            verificationOptions={verificationOptions}
            certificationOptions={certificationOptions}
            placementTypesOptions={placementTypes}
            selectedSpecializations={formData.selectedSpecializations}
            expandedSpecializations={expandedSpecializations}
            onCheckboxChange={handleCheckboxChange}
            onIndustryChange={handleIndustryChange}
            onCustomIndustryChange={handleCustomIndustryChange}
            onToggleCategory={toggleCategory}
            onPlacementTypeChange={handlePlacementTypeChange}
            onSpecializationChange={handleSpecializationChange}
            onToggleSpecialization={toggleSpecialization}
          />
        )}

        {currentStep === 3 && (
          <Documents
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            onRemoveFile={removeFile}
          />
        )}

        {currentStep === 4 && (
          <Review
            formData={formData}
            uploadedFiles={uploadedFiles}
            orderCategoryOptions={orderCategoryOptions}
            verificationOptions={verificationOptions}
            certificationOptions={certificationOptions}
            responseTimeOptions={responseTimeOptions}
            industryCategories={industryCategories}
            placementTypes={placementTypes}
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <FooterNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={nextStep}
        onPrev={prevStep}
        onSaveClose={saveAndClose}
        onSubmit={submitForm}
        onSubmitAndPublish={submitAndPublish}
        onCancel={onCancel}
        router={router}
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}
