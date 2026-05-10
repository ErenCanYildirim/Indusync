"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  User,
  Briefcase,
  ShieldCheck,
  LucideIcon,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RegistrationFormData } from "@/lib/types/registration";
import {
  AddressAutocomplete,
  GeoapifyAddress,
} from "@/components/ui/address-autocomplete";
import { parseGeoapifyAddress, getCityBias } from "@/lib/utils/address-utils";
import { useTranslations, useLocale } from "next-intl";

//Reviewed
//Ok

// Define interfaces for props
interface StepDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  fields: string[]; // Fields belonging to this step for validation purposes
}

interface RegistrationStepperProps {
  accountType: "personal" | "business";
  formData: any;
  formErrors: any;
  formTouched: any;
  isSubmitting: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onCheckboxChange: (
    checked: boolean,
    name: string,
    isInterest?: boolean
  ) => void;
  onSelectChange: (value: string, name: string) => void;
  onFieldBlur?: (fieldName: string) => void;
  // Updated onSubmit to match useFormData's handleSubmit signature
  onSubmit: (
    payload?: Partial<any>, // Using 'any' for now, ideally infer from a generic schema type
    event?: React.FormEvent<HTMLFormElement>
  ) => Promise<void> | void;
  onStepSubmit: (fieldstoValidate: string[]) => boolean;
  setTermsAccepted: (value: boolean) => void;
  setPrivacyAccepted: (value: boolean) => void;
  setFormData: (updater: (prev: any) => any) => void;
}

const interestsList = [
  { id: "elektrotechnik", label: "Elektrotechnik" },
  { id: "mechanik", label: "Mechanik / Stahlbau" },
  { id: "programmierung", label: "Programmierung" },
  { id: "anlagenbau", label: "Anlagenbau" },
  { id: "mechatronik", label: "Mechatronik" },
  { id: "automatisierung", label: "Automatisierungstechnik" },
  { id: "wartung", label: "Wartung & Instandhaltung" },
  { id: "beratung", label: "Beratung & Planung" },
];

// Add specialization interfaces
interface Specialization {
  id: string;
  name: string;
  subCategories?: Specialization[];
  subcategories?: Specialization[];
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
          { id: "trinkwasserversorung_haupt", name: "Trinkwasserversorgung" }, // Changed ID
          { id: "gasinstallation", name: "Gasinstallation" },
          { id: "sanitäre_einrichtunge", name: "Sanitäre Einrichtungen" },
          { id: "wasseraufbereitung", name: "Wasseraufbereitung" },
          { id: "rohrverlegung_tw", name: "Rohrverlegung (Trinkwasser)" }, // Clarified ID and name
          { id: "trinkwasser_anlagenbau", name: "Anlagenbau Trinkwasser" }, // Changed ID and clarified name for the second instance
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
      { id: "deckenabhängung", name: "Deckenabhängung" }, // Added name
      { id: "bodenbeläge", name: "Bodenbeläge" },
      { id: "trockenputz", name: "Trockenputz" },
      { id: "akustik", name: "Akustikdecken & -wände" },
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

const industryCategories: IndustryCategory[] = [
  {
    id: "plant-engineering",
    label: "plantEngineering",
  },
  {
    id: "healthcare",
    label: "healthcare",
  },
  {
    id: "agriculture-resources",
    label: "agricultureResources",
    subcategories: [
      { id: "agriculture-forestry", label: "agricultureForestry" },
      { id: "mining", label: "mining" },
    ],
  },
  {
    id: "manufacturing",
    label: "manufacturing",
    subcategories: [
      { id: "automotive", label: "automotive" },
      { id: "mechanical-engineering", label: "mechanicalEngineering" },
      { id: "chemical", label: "chemical" },
      { id: "electrical", label: "electrical" },
      { id: "metal", label: "metal" },
      { id: "plastics", label: "plastics" },
      { id: "paper-printing", label: "paperPrinting" },
      { id: "textile-clothing", label: "textileClothing" },
      {
        id: "food-beverage",
        label: "foodBeverage",
      },
      { id: "pharmaceutical", label: "pharmaceutical" },
      { id: "medical-technology", label: "medicalTechnology" },
      { id: "agricultural-technology", label: "agriculturalTechnology" },
    ],
  },
  {
    id: "construction-infrastructure",
    label: "constructionInfrastructure",
    subcategories: [
      {
        id: "construction",
        label: "construction",
        subcategories: [
          { id: "building-construction", label: "buildingConstruction" },
          { id: "civil-engineering", label: "civilEngineering" },
        ],
      },
      { id: "shipbuilding", label: "shipbuilding" },
    ],
  },
  {
    id: "energy-environment",
    label: "energyEnvironment",
    subcategories: [
      { id: "energy", label: "energy" },
      { id: "renewable-energy", label: "renewableEnergy" },
      { id: "environmental-technology", label: "environmentalTechnology" },
    ],
  },
  {
    id: "services-trade",
    label: "servicesTrade",
    subcategories: [
      { id: "retail", label: "retail" },
      { id: "logistics-transport", label: "logisticsTransport" },
      { id: "tourism-hospitality", label: "tourismHospitality" },
      { id: "financial-services", label: "financialServices" },
      { id: "education", label: "education" },
      { id: "creative-industry", label: "creativeIndustry" },
      { id: "sports-leisure", label: "sportsLeisure" },
      { id: "recycling", label: "recycling" },
    ],
  },
  {
    id: "technology-innovation",
    label: "technologyInnovation",
    subcategories: [
      {
        id: "ict",
        label: "ict",
      },
      { id: "biotechnology", label: "biotechnology" },
      { id: "aerospace", label: "aerospace" },
      { id: "research-development", label: "researchDevelopment" },
    ],
  },
  {
    id: "other",
    label: "other",
    subcategories: [{ id: "custom", label: "custom" }],
  },
];

const orderCategoryOptions = [
  { id: "CONSTRUCTION", label: "CONSTRUCTION" },
  { id: "MAINTENANCE", label: "MAINTENANCE" },
  { id: "EMERGENCY_REPAIR", label: "EMERGENCY_REPAIR" },
  { id: "CONSULTING", label: "CONSULTING" },
  { id: "MECHANICAL_ENGINEERING", label: "MECHANICAL_ENGINEERING" },
  { id: "ELECTRICAL_WORK", label: "ELECTRICAL_WORK" },
  { id: "PLUMBING", label: "PLUMBING" },
  { id: "HVAC", label: "HVAC" },
  { id: "INDUSTRIAL_CLEANING", label: "INDUSTRIAL_CLEANING" },
  { id: "WELDING", label: "WELDING" },
  { id: "PAINTING", label: "PAINTING" },
  { id: "INSULATION", label: "INSULATION" },
  { id: "AUTOMATION", label: "AUTOMATION" },
  { id: "INSTRUMENTATION", label: "INSTRUMENTATION" },
  { id: "SAFETY_INSPECTION", label: "SAFETY_INSPECTION" },
  { id: "CRANE_OPERATION", label: "CRANE_OPERATION" },
  { id: "SCAFFOLDING", label: "SCAFFOLDING" },
  { id: "CONFINED_SPACE", label: "CONFINED_SPACE" },
  { id: "HEIGHT_WORK", label: "HEIGHT_WORK" },
  { id: "SHUTDOWN_MAINTENANCE", label: "SHUTDOWN_MAINTENANCE" },
  { id: "OTHER", label: "OTHER" },
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
}: {
  specializations: Specialization[];
  selectedSpecializations: string[];
  expandedSpecializations: string[];
  onSpecializationChange: (specializationId: string) => void;
  onToggleSpecialization: (specializationId: string) => void;
  idPrefix?: string;
  level?: number;
}) => {
  const t = useTranslations("Registration");
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
                  {t(`specializations.${spec.id}`) || spec.name}
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
                  {t(`specializations.${spec.id}`) || spec.name}
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

// Component for Industry Selection
const IndustrySelector = ({
  industryCategories,
  selectedIndustries,
  expandedCategories,
  onIndustryChange,
  onToggleCategory,
  idPrefix = "industry",
}: {
  industryCategories: IndustryCategory[];
  selectedIndustries: string[];
  expandedCategories: string[];
  onIndustryChange: (industryId: string) => void;
  onToggleCategory: (categoryId: string) => void;
  idPrefix?: string;
}) => {
  const t = useTranslations("Registration");
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
                {t(`industries.${category.label}`)}
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
                          {t(`industries.${subcat.label}`)}
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
                                {t(`industries.${subsubcat.label}`)}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export function RegistrationStepper({
  accountType,
  formData,
  formErrors,
  formTouched,
  isSubmitting,
  termsAccepted,
  privacyAccepted,
  onInputChange,
  onCheckboxChange,
  onSelectChange,
  onFieldBlur,
  onSubmit,
  onStepSubmit,
  setTermsAccepted,
  setPrivacyAccepted,
  setFormData,
}: Readonly<RegistrationStepperProps>) {
  const t = useTranslations("Registration");
  const currentLocale = useLocale();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >(formData.specializations || []);
  const [expandedSpecializations, setExpandedSpecializations] = useState<
    string[]
  >([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    formData.industries || []
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedOrderCategories, setSelectedOrderCategories] = useState<
    string[]
  >(formData.orderCategories || []);

  // File states to store actual File objects
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [certificatesFile, setCertificatesFile] = useState<File | null>(null);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Save selected values to form data when they change
  React.useEffect(() => {
    // Use setFormData directly instead of synthetic events
    setFormData((prev) => ({
      ...prev,
      specializations: selectedSpecializations,
      industries: selectedIndustries,
      orderCategories: selectedOrderCategories,
    }));
  }, [
    selectedSpecializations,
    selectedIndustries,
    selectedOrderCategories,
    setFormData,
  ]);

  // Ensure currentStep is always within bounds when steps change (e.g., when Auftragnehmer checkbox is toggled)
  React.useEffect(() => {
    const updatedSteps = getSteps();
    setCurrentStep((prev) => Math.min(prev, updatedSteps.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.companyTypeAuftragnehmer]);

  // Define steps dynamically based on whether Auftragnehmer is selected
  const getSteps = () => {
    const baseSteps: StepDefinition[] = [
      {
        id: "account-setup",
        name: t("steps.accountSetup"),
        icon: User,
        fields: ["email", "password", "confirmPassword"],
      },
      {
        id: "profile-details",
        name: t("steps.profileDetails"),
        icon: Briefcase,
        fields: [
          ...(accountType === "personal"
            ? ["firstName", "lastName"]
            : ["companyName", "companyType", "taxId"]),
          "street",
          "houseNumber",
          "postalCode",
          "city",
          "country",
          "phone",
          // "website" is optional, validation handled by useForm
        ],
      },
      {
        id: "finalize",
        name: t("steps.finalize"),
        icon: ShieldCheck,
        fields: [
          /* "referralSource", "interests", "emailNotifications", "newsletter" - no direct validation needed here, terms/privacy handled separately */
        ],
      },
    ];

    // Insert Auftragnehmer-specific step if selected
    if (formData.companyTypeAuftragnehmer) {
      baseSteps.splice(2, 0, {
        id: "auftragnehmer-details",
        name: t("steps.contractorDetails"),
        icon: Briefcase,
        fields: [],
      });
    }

    return baseSteps;
  };

  const steps = getSteps();
  const CurrentStepIcon = steps[currentStep]?.icon;

  const handleSpecializationChange = (specializationId: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(specializationId)
        ? prev.filter((id) => id !== specializationId)
        : [...prev, specializationId]
    );
  };

  const handleToggleSpecialization = (specializationId: string) => {
    setExpandedSpecializations((prev) =>
      prev.includes(specializationId)
        ? prev.filter((id) => id !== specializationId)
        : [...prev, specializationId]
    );
  };

  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industryId)
        ? prev.filter((id) => id !== industryId)
        : [...prev, industryId]
    );
  };

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleOrderCategoryChange = (categoryId: string) => {
    setSelectedOrderCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const nextStep = () => {
    const currentStepFields = steps[currentStep].fields;
    if (onStepSubmit(currentStepFields)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (stepIndex: number) => {
    // Allow going back to any previous step that has been "visited"
    // or if the current step is being validated before moving to a specific step.
    // For simplicity, only allow going to previous steps directly.
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const getStepIconClassName = (index: number, currentStep: number) => {
    if (index === currentStep)
      return "border-primary ring-2 ring-primary ring-offset-2";
    if (index < currentStep) return "border-primary bg-primary-lightest";
    return "border-gray-300 group-hover:border-gray-400";
  };

  const renderField = (
    name: string,
    label: string,
    placeholder?: string,
    type: string = "text",
    options?: { value: string; label: string }[],
    required: boolean = false
  ) => {
    const hasError = formErrors[name] && formTouched[name];
    const value = formData[name] !== undefined ? formData[name] : "";

    // Determine if this is a password field and get the appropriate visibility state
    const isPasswordField = type === "password";
    const isConfirmPasswordField = name === "confirmPassword";
    const showPasswordValue = isConfirmPasswordField
      ? showConfirmPassword
      : showPassword;
    const actualInputType =
      isPasswordField && showPasswordValue ? "text" : type;

    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {type === "select" ? (
          <Select
            name={name}
            value={value}
            onValueChange={(value) => onSelectChange(value, name)}
          >
            <SelectTrigger
              id={name}
              className={cn(
                hasError ? "border-destructive" : "border-input",
                "bg-background text-foreground"
              )}
            >
              <SelectValue placeholder={placeholder ?? "Bitte auswählen"} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {options?.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="hover:bg-muted"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="relative">
            <Input
              id={name}
              name={name}
              type={actualInputType}
              placeholder={placeholder ?? t("validation.pleaseSelect")}
              value={value}
              onChange={onInputChange}
              onBlur={() => onFieldBlur && onFieldBlur(name)}
              className={cn(
                hasError ? "border-destructive" : "border-input",
                "bg-background text-foreground",
                isPasswordField && "pr-10" // Add padding for the eye icon
              )}
            />
            {isPasswordField && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  if (isConfirmPasswordField) {
                    setShowConfirmPassword(!showConfirmPassword);
                  } else {
                    setShowPassword(!showPassword);
                  }
                }}
                tabIndex={-1}
              >
                {showPasswordValue ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
        {hasError && (
          <p className="text-destructive text-xs mt-1">{formErrors[name]}</p>
        )}
      </div>
    );
  };

  const renderAccountDetails = () => {
    return (
      <>
        {accountType === "business" ? (
          <>
            {renderField(
              "companyName",
              t("fields.companyName"),
              "Musterfirma GmbH",
              "text",
              undefined,
              true
            )}
            {renderField(
              "companyType",
              t("fields.companyType"),
              "",
              "select",
              [
                {
                  value: "einzelunternehmen",
                  label: t("companyTypes.einzelunternehmen"),
                },
                { value: "gbr", label: t("companyTypes.gbr") },
                { value: "gmbh", label: t("companyTypes.gmbh") },
                { value: "ag", label: t("companyTypes.ag") },
                { value: "ug", label: t("companyTypes.ug") },
                { value: "ohg", label: t("companyTypes.ohg") },
                { value: "kg", label: t("companyTypes.kg") },
                { value: "gmbh_co_kg", label: t("companyTypes.gmbh_co_kg") },
                { value: "other", label: t("companyTypes.other") },
              ],
              true
            )}
            {renderField("taxId", "Umsatzsteuer-ID", "DE123456789", "text")}
            <div className="space-y-2">
              <Label className="text-foreground">{t("companyRoles.iAm")}</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="companyTypeAuftraggeber"
                    name="companyTypeAuftraggeber"
                    checked={!!formData.companyTypeAuftraggeber}
                    onCheckedChange={(checked) =>
                      onCheckboxChange(
                        checked as boolean,
                        "companyTypeAuftraggeber"
                      )
                    }
                  />
                  <Label htmlFor="companyTypeAuftraggeber">
                    {t("companyRoles.client")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="companyTypeAuftragnehmer"
                    name="companyTypeAuftragnehmer"
                    checked={!!formData.companyTypeAuftragnehmer}
                    onCheckedChange={(checked) =>
                      onCheckboxChange(
                        checked as boolean,
                        "companyTypeAuftragnehmer"
                      )
                    }
                  />
                  <Label htmlFor="companyTypeAuftragnehmer">
                    {t("companyRoles.contractor")}
                  </Label>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {renderField("firstName", t("fields.firstName"))}
            {renderField("lastName", t("fields.lastName"))}
          </>
        )}
        {/* Address Autocomplete */}
        <div className="space-y-4">
          <AddressAutocomplete
            label={t("additionalFields.address")}
            placeholder={t("additionalFields.addressPlaceholder")}
            value={`${formData.street || ""} ${
              formData.houseNumber || ""
            }`.trim()}
            onAddressSelect={(address: GeoapifyAddress) => {
              const parsed = parseGeoapifyAddress(address);
              // Update form data with parsed address
              setFormData((prev) => ({
                ...prev,
                street: parsed.street,
                houseNumber: parsed.houseNumber,
                postalCode: parsed.postalCode,
                city: parsed.city,
                country: parsed.country,
                latitude: parsed.latitude,
                longitude: parsed.longitude,
              }));
            }}
            onInputChange={(value) => {
              // Handle manual input
              const parts = value.split(" ");
              if (parts.length >= 2) {
                const lastPart = parts[parts.length - 1];
                if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
                  setFormData((prev) => ({
                    ...prev,
                    street: parts.slice(0, -1).join(" "),
                    houseNumber: lastPart,
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    street: value,
                    houseNumber: "",
                  }));
                }
              } else {
                setFormData((prev) => ({
                  ...prev,
                  street: value,
                  houseNumber: "",
                }));
              }
            }}
            error={!!(formErrors.street || formErrors.houseNumber)}
            errorMessage={formErrors.street || formErrors.houseNumber}
            bias={getCityBias(formData.city || "") || undefined}
            className="mb-4"
          />

          {/* Manual address fields (filled automatically but can be edited) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              {renderField(
                "postalCode",
                t("fields.postalCode"),
                "12345",
                "text",
                [],
                true
              )}
            </div>
            <div className="col-span-2">
              {renderField(
                "city",
                t("fields.city"),
                "Musterstadt",
                "text",
                [],
                true
              )}
            </div>
          </div>
          {renderField(
            "country",
            t("additionalFields.country"),
            t("additionalFields.countryPlaceholder"),
            "text",
            [],
            true
          )}
        </div>
        {renderField(
          "phone",
          t("fields.phone"),
          "+49 123 456789",
          "tel",
          [],
          true
        )}
        {renderField(
          "website",
          t("additionalFields.website"),
          "https://ihre-firma.de",
          "url"
        )}
      </>
    );
  };

  // Reusable component for the final agreement step
  const FinalizeStep = () => (
    <>
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        {t("additionalFields.additionalInfo")}
      </h2>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          {t("additionalFields.notifications")}
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailNotifications"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onCheckedChange={(checked) =>
                onCheckboxChange(!!checked, "emailNotifications")
              }
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label
              htmlFor="emailNotifications"
              className="font-normal text-foreground"
            >
              {t("additionalFields.emailNotifications")}
            </Label>
          </div>
        </div>
      </div>

      {currentStep === steps.length - 1 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="termsAccepted"
              name="termsAccepted"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
              disabled={isSubmitting}
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label
              htmlFor="termsAccepted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
            >
              {t("additionalFields.termsText")}{" "}
              <Link
                href="/agb"
                className="underline text-primary hover:text-primary/80"
                target="_blank"
              >
                {t("footer.terms")}
              </Link>
              .
            </Label>
          </div>
          {formErrors.termsAccepted && (
            <p className="text-destructive text-xs">
              {formErrors.termsAccepted}
            </p>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacyAccepted"
              name="privacyAccepted"
              checked={privacyAccepted}
              onCheckedChange={(checked) =>
                setPrivacyAccepted(Boolean(checked))
              }
              disabled={isSubmitting}
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label
              htmlFor="privacyAccepted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
            >
              {t("additionalFields.privacyText")}{" "}
              <Link
                href="/datenschutz"
                className="underline text-primary hover:text-primary/80"
                target="_blank"
              >
                {t("footer.privacy")}
              </Link>{" "}
              {t("additionalFields.privacyTextEnd")}
            </Label>
          </div>
          {formErrors.privacyAccepted && (
            <p className="text-destructive text-xs">
              {formErrors.privacyAccepted}
            </p>
          )}
        </div>
      )}
    </>
  );

  // Create stable input change handler at top level
  const stabilizedOnInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // In React 17+, events are automatically persisted, no need for e.persist()
      onInputChange(e);
    },
    [onInputChange]
  );

  // Create stable memoized component for Auftragnehmer details to prevent re-renders
  const AuftragnehmerDetailsStep = React.useMemo(() => {
    return (
      <>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          {t("steps.contractorDetails")}
        </h2>
        {/* --- Unternehmens­name --- */}
        <div className="space-y-2">
          <Label htmlFor="companyDetailsName" className="text-foreground">
            {t("fields.companyDetailsName")}*
          </Label>
          <Input
            id="companyDetailsName"
            name="companyDetailsName"
            placeholder="Bitte hier Ihren Unternehmensnamen einfügen"
            value={formData.companyDetailsName || ""}
            onChange={stabilizedOnInputChange}
            className="bg-background text-foreground"
          />
        </div>

        {/* --- Hauptsitz --- */}
        <div className="space-y-4">
          <AddressAutocomplete
            label={t("additionalFields.headquarters")}
            placeholder={t("additionalFields.headquartersPlaceholder")}
            value={
              typeof formData.companyAddress === "string"
                ? formData.companyAddress
                : ""
            }
            onAddressSelect={(address: GeoapifyAddress) => {
              const parsed = parseGeoapifyAddress(address);
              // Update form data with parsed address
              setFormData((prev) => ({
                ...prev,
                companyAddress: parsed.formattedAddress,
                companyPostalCode: parsed.postalCode,
                companyCity: parsed.city,
                latitude: parsed.latitude,
                longitude: parsed.longitude,
              }));
            }}
            onInputChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                companyAddress: value,
              }));
            }}
            error={!!formErrors.companyAddress}
            errorMessage={formErrors.companyAddress}
            bias={getCityBias(formData.companyCity || "") || undefined}
            className="mb-4"
          />

          {/* Manual fields (filled automatically but can be edited) */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="companyPostalCode"
              name="companyPostalCode"
              placeholder={t("fields.companyPostalCode")}
              value={formData.companyPostalCode || ""}
              onChange={stabilizedOnInputChange}
              className="bg-background text-foreground"
            />
            <Input
              id="companyCity"
              name="companyCity"
              placeholder={t("fields.companyCity")}
              value={formData.companyCity || ""}
              onChange={stabilizedOnInputChange}
              className="bg-background text-foreground"
            />
          </div>
        </div>

        {/* --- Radius --- */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="workRadiusKm" className="text-foreground">
            {t("additionalFields.workRadius")}
          </Label>
          <Input
            id="workRadiusKm"
            name="workRadiusKm"
            type="number"
            value={formData.workRadiusKm ?? ""}
            onChange={stabilizedOnInputChange}
            placeholder={t("additionalFields.workRadiusPlaceholder")}
            className="bg-background text-foreground"
          />
        </div>

        {/* --- Branchen, Spezialisierungen, Kategorien --- */}
        {/* Spezialiserungen */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium text-foreground">
            {t("specializations.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("specializations.description")}
          </p>
          <div className="border rounded-lg p-4">
            <SpecializationSelector
              specializations={actual_specializations}
              selectedSpecializations={selectedSpecializations}
              expandedSpecializations={expandedSpecializations}
              onSpecializationChange={handleSpecializationChange}
              onToggleSpecialization={handleToggleSpecialization}
            />
          </div>
        </div>

        {/* Branchen */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium text-foreground">
            {t("industries.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("industries.description")}
          </p>
          <div className="border rounded-lg p-4">
            <IndustrySelector
              industryCategories={industryCategories}
              selectedIndustries={selectedIndustries}
              expandedCategories={expandedCategories}
              onIndustryChange={handleIndustryChange}
              onToggleCategory={handleToggleCategory}
            />
          </div>
        </div>

        {/* Auftrags­kategorien */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium text-foreground">
            {t("orderCategories.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("orderCategories.description")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {orderCategoryOptions.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedOrderCategories.includes(category.id)}
                  onCheckedChange={() => handleOrderCategoryChange(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm leading-none"
                >
                  {t(`orderCategories.${category.label}`)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Datei-Uploads */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="companyVerification" className="text-foreground">
            {t("fileUpload.companyVerification")}
          </Label>
          <div className="flex items-center w-full">
            <Input
              id="companyVerification"
              name="companyVerification"
              type="text"
              readOnly
              placeholder={
                verificationFile
                  ? verificationFile.name
                  : t("fileUpload.verificationPlaceholder")
              }
              value={verificationFile ? verificationFile.name : ""}
              className="bg-background text-foreground"
            />
            <input
              id="companyVerificationFile"
              name="companyVerificationFile"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVerificationFile(file);
                  stabilizedOnInputChange({
                    target: {
                      name: "companyVerificationFile",
                      value: file.name,
                    },
                  } as any);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={() =>
                document.getElementById("companyVerificationFile")?.click()
              }
            >
              {t("fileUpload.browse")}
            </Button>
          </div>
          {verificationFile && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("fileUpload.selectedFile", {
                name: verificationFile.name,
                size: (verificationFile.size / 1024 / 1024).toFixed(2),
              })}
            </p>
          )}
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="companyCertificates" className="text-foreground">
            {t("fileUpload.companyCertificates")}
          </Label>
          <div className="flex items-center w-full">
            <Input
              id="companyCertificates"
              name="companyCertificates"
              type="text"
              readOnly
              placeholder={
                certificatesFile
                  ? certificatesFile.name
                  : t("fileUpload.certificatesPlaceholder")
              }
              value={certificatesFile ? certificatesFile.name : ""}
              className="bg-background text-foreground"
            />
            <input
              id="companyCertificatesFile"
              name="companyCertificatesFile"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCertificatesFile(file);
                  stabilizedOnInputChange({
                    target: {
                      name: "companyCertificatesFile",
                      value: file.name,
                    },
                  } as any);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={() =>
                document.getElementById("companyCertificatesFile")?.click()
              }
            >
              {t("fileUpload.browse")}
            </Button>
          </div>
          {certificatesFile && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("fileUpload.selectedFile", {
                name: certificatesFile.name,
                size: (certificatesFile.size / 1024 / 1024).toFixed(2),
              })}
            </p>
          )}
        </div>

        {/* Firmenbeschreibung */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="companyDescription">
            {t("fields.companyDescription")}
          </Label>
          <Textarea
            id="companyDescription"
            name="companyDescription"
            value={formData.companyDescription ?? ""}
            onChange={stabilizedOnInputChange}
            placeholder="Beschreiben Sie Ihr Unternehmen..."
            className="h-24"
          />
          {formErrors.companyDescription && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.companyDescription}
            </p>
          )}
        </div>

        {/* Hidden geo fields */}
        <input type="hidden" name="latitude" value={formData.latitude ?? ""} />
        <input
          type="hidden"
          name="longitude"
          value={formData.longitude ?? ""}
        />
      </>
    );
  }, [
    formData.companyDetailsName,
    formData.companyAddress,
    formData.companyPostalCode,
    formData.companyCity,
    formData.workRadiusKm,
    formData.companyDescription,
    formData.latitude,
    formData.longitude,
    formErrors.companyDescription,
    selectedSpecializations,
    expandedSpecializations,
    selectedIndustries,
    expandedCategories,
    selectedOrderCategories,
    verificationFile,
    certificatesFile,
    stabilizedOnInputChange,
    handleSpecializationChange,
    handleToggleSpecialization,
    handleIndustryChange,
    handleToggleCategory,
    handleOrderCategoryChange,
    setVerificationFile,
    setCertificatesFile,
  ]);

  const renderStepContent = () => {
    // If the company did NOT select "Auftragnehmer", step 2 should actually show the FinalizeStep
    if (currentStep === 2 && !formData.companyTypeAuftragnehmer) {
      return <FinalizeStep />;
    }

    switch (currentStep) {
      case 0:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              {t("fields.email")}
            </h2>
            {renderField(
              "email",
              t("fields.email"),
              "ihre.email@beispiel.de",
              "email",
              undefined,
              true
            )}
            {renderField(
              "password",
              t("fields.password"),
              "",
              "password",
              undefined,
              true
            )}
            {renderField(
              "confirmPassword",
              t("fields.confirmPassword"),
              "",
              "password",
              undefined,
              true
            )}
            {formErrors.password &&
              formTouched.password &&
              !formErrors.confirmPassword && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("additionalFields.passwordHint")}
                </p>
              )}
          </>
        );
      case 1:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              {accountType === "business"
                ? t("steps.profileDetails")
                : t("steps.profileDetails")}
            </h2>
            {renderAccountDetails()}
          </>
        );
      case 2:
        // If Auftragnehmer checkbox is selected, show its details, otherwise skip to finalize
        if (formData.companyTypeAuftragnehmer) {
          return AuftragnehmerDetailsStep;
        }
        return <FinalizeStep />;
      case 3:
        return <FinalizeStep />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stepper Header (Desktop) */}
      <div className="hidden md:flex justify-between items-center mb-8 relative">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={cn(
              "relative flex flex-col items-center focus:outline-none group",
              index <= currentStep ? "text-primary" : "text-muted-foreground",
              index > currentStep
                ? "cursor-not-allowed"
                : "hover:text-primary-dark"
            )}
            disabled={index > currentStep}
            role="tab"
            aria-selected={index === currentStep}
            aria-controls={`step-${step.id}`}
            tabIndex={index <= currentStep ? 0 : -1}
          >
            <div
              className={cn(
                "rounded-full w-10 h-10 flex items-center justify-center border-2",
                getStepIconClassName(index, currentStep)
              )}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <p
              className={cn(
                "text-sm mt-2 text-center",
                index <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.name}
            </p>
          </button>
        ))}
      </div>

      {/* Mobile Stepper Header */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">
            {t("navigation.stepOf", {
              current: currentStep + 1,
              total: steps.length,
              name: steps[currentStep].name,
            })}
          </h3>
          {CurrentStepIcon && (
            <CurrentStepIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <Progress
          value={((currentStep + 1) / steps.length) * 100}
          className="w-full h-2 bg-muted"
        />
      </div>

      <Card className="border-0 shadow-none md:border md:shadow-md md:bg-card md:border-border">
        <CardContent className="space-y-6 pt-6">
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border-border text-foreground hover:bg-muted"
          >
            {t("navigation.back")}
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t("navigation.next")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                console.log("Submit button clicked");

                // Build update object without null files to avoid validation errors
                const additionalUpdates: any = {
                  specializations: selectedSpecializations,
                  industries: selectedIndustries,
                  orderCategories: selectedOrderCategories,
                };
                if (verificationFile) {
                  additionalUpdates._verificationFile = verificationFile;
                }
                if (certificatesFile) {
                  additionalUpdates._certificatesFile = certificatesFile;
                }

                setFormData((prev) => ({ ...prev, ...additionalUpdates }));

                // Log all registration data
                console.log("Registration Data:", {
                  ...formData,
                  specializations: selectedSpecializations,
                  industries: selectedIndustries,
                  orderCategories: selectedOrderCategories,
                  verificationFile: verificationFile
                    ? {
                        name: verificationFile.name,
                        size: verificationFile.size,
                        type: verificationFile.type,
                      }
                    : null,
                  certificatesFile: certificatesFile
                    ? {
                        name: certificatesFile.name,
                        size: certificatesFile.size,
                        type: certificatesFile.type,
                      }
                    : null,
                });

                // Prepare payload for handleSubmit
                const submitPayload: any = {
                  specializations: selectedSpecializations,
                  industries: selectedIndustries,
                  orderCategories: selectedOrderCategories,
                };

                if (verificationFile) {
                  submitPayload._verificationFile = verificationFile;
                }
                if (certificatesFile) {
                  submitPayload._certificatesFile = certificatesFile;
                }

                // Call onSubmit (which is handleSubmit from useFormData) with the payload
                onSubmit(submitPayload);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground relative"
              disabled={isSubmitting || !termsAccepted || !privacyAccepted}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("navigation.submitting")}
                </div>
              ) : (
                t("navigation.submit")
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
