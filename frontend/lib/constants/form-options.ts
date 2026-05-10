// Shared form options and constants for project creation and matching preview

// Industry categories with nested subcategories
export const industryCategories = [
    {
        id: "plant-engineering",
        label: "Anlagenbau",
    },
    {
        id: "healthcare",
        label: "Gesundheitswesen",
    },
    {
        id: "agriculture-resources",
        label: "Landwirtschaft und Rohstoffe",
        subcategories: [
            { id: "agriculture-forestry", label: "Land- und Forstwirtschaft" },
            { id: "mining", label: "Bergbau" },
        ],
    },
    {
        id: "manufacturing",
        label: "Verarbeitende Industrie",
        subcategories: [
            { id: "automotive", label: "Automobilindustrie" },
            { id: "mechanical-engineering", label: "Maschinenbau" },
            { id: "chemical", label: "Chemieindustrie" },
            { id: "electrical", label: "Elektrotechnik und Elektronik" },
            { id: "metal", label: "Metallindustrie" },
            { id: "plastics", label: "Kunststoffindustrie" },
            { id: "paper-printing", label: "Papier- und Druckindustrie" },
            { id: "textile-clothing", label: "Textil- und Bekleidungsindustrie" },
            { id: "food-beverage", label: "Nahrungsmittel- und Getränkeindustrie" },
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
            { id: "ict", label: "Informations- und Kommunikationstechnologie (IKT)" },
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

// Placement types with descriptions
export const placementTypes = [
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

// Verification options
export const verificationOptions = [
    { id: "registered", label: "Eingetragenes Unternehmen" },
    { id: "insured", label: "Betriebshaftpflichtversicherung" },
    { id: "taxId", label: "Gültige Steuernummer" },
    { id: "employees", label: "Festangestellte Mitarbeiter" },
];

// Certification options
export const certificationOptions = [
    { id: "iso9001", label: "ISO 9001" },
    { id: "iso14001", label: "ISO 14001" },
    { id: "tuv", label: "TÜV-Zertifizierung" },
    { id: "vds", label: "VdS-Anerkennung" },
    { id: "scc", label: "SCC-Zertifizierung" },
];

// Urgency options
export const URGENCY_OPTIONS = [
    { value: "LOW", label: "Niedrig" },
    { value: "MEDIUM", label: "Mittel" },
    { value: "HIGH", label: "Hoch" },
    { value: "URGENT", label: "Sofort" },
];

// Actual specializations with nested structure
export const actual_specializations = [
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
        id: "maschinenbau",
        name: "Maschinenbau",
        subCategories: [
            { id: "antriebstechnik", name: "Antriebstechnik" },
            { id: "regelungstechnik", name: "Regelungstechnik" },
            { id: "messtechnik", name: "Messtechnik" },
            { id: "mikrosystemtechnik", name: "Mikrosystemtechnik" },
            { id: "sonderleistung", name: "Sonderleistung" },
        ],
    },
    {
        id: "automatisierung",
        name: "Automatisierungstechnik",
        subCategories: [
            { id: "sps-programmierung", name: "SPS-Programmierung" },
            { id: "instandhaltung", name: "Instandhaltung" },
            { id: "qualitaetskontrolle", name: "Qualitätskontrolle" },
            { id: "projektmanagement", name: "Projektmanagement" },
        ],
    },
    {
        id: "mechanik",
        name: "Mechanik / Stahlbau / Lackiererei",
        subCategories: [
            { id: "metallbau", name: "Metallbau" },
            { id: "schweissen", name: "Schweißen" },
            { id: "zerspanungstechnik", name: "Zerspanungstechnik" },
            { id: "lackierung", name: "Lackierung" },
            { id: "oberflächentechnik", name: "Oberflächentechnik" },
        ],
    },
    {
        id: "baugewerbe",
        name: "Baugewerbe",
        subCategories: [
            { id: "hochbau", name: "Hochbau" },
            { id: "tiefbau", name: "Tiefbau" },
            { id: "sanierung", name: "Sanierung" },
            { id: "abbruch", name: "Abbruch" },
        ],
    },
    {
        id: "sicherheit",
        name: "Sicherheit und Prüfung",
        subCategories: [
            { id: "arbeitsschutz", name: "Arbeitsschutz" },
            { id: "brandschutz", name: "Brandschutz" },
            { id: "prüfung", name: "Prüfung und Wartung" },
            { id: "sicherheitstechnik", name: "Sicherheitstechnik" },
        ],
    },
    {
        id: "umwelt",
        name: "Umwelt und Entsorgung",
        subCategories: [
            { id: "abfallentsorgung", name: "Abfallentsorgung" },
            { id: "recycling", name: "Recycling" },
            { id: "umweltschutz", name: "Umweltschutz" },
            { id: "dekontamination", name: "Dekontamination" },
        ],
    },
    {
        id: "transport",
        name: "Transport und Logistik",
        subCategories: [
            { id: "schwertransport", name: "Schwertransport" },
            { id: "kranarbeiten", name: "Kranarbeiten" },
            { id: "lagerlogistik", name: "Lagerlogistik" },
            { id: "spedition", name: "Spedition" },
        ],
    },
];

// Define types for better type safety
export interface Specialization {
    id: string;
    name: string;
    subCategories?: Specialization[];
}

export interface IndustryCategory {
    id: string;
    label: string;
    subcategories?: IndustryCategory[];
}

export interface PlacementType {
    id: string;
    label: string;
    description: string;
}

export interface VerificationOption {
    id: string;
    label: string;
}

export interface CertificationOption {
    id: string;
    label: string;
}

export interface UrgencyOption {
    value: string;
    label: string;
} 