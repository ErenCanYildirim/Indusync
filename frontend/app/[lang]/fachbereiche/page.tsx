import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceSpecializationSelector } from "@/components/service-specialization-selector";

export const metadata: Metadata = {
  title: "Fachbereiche | IndustrieConnect",
  description:
    "Entdecken Sie die verschiedenen Fachbereiche und Spezialisierungen auf IndustrieConnect.",
};

export default function SpecializationsPage() {
  return (
    <div className="container max-w-5xl py-8 md:py-12">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          Fachbereiche
        </h1>
        <p className="text-muted-foreground">
          Entdecken Sie die verschiedenen Fachbereiche und Spezialisierungen,
          die auf unserer Plattform verfügbar sind.
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <ServiceSpecializationSelector readOnly />
      </div>

      <div className="mt-12 bg-primary/5 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-primary">
          Werden Sie Teil unseres Netzwerks
        </h2>
        <p className="mb-6 text-muted-foreground">
          Registrieren Sie Ihr Unternehmen und geben Sie Ihre Spezialisierungen
          an, um passende Aufträge zu finden oder qualifizierte Dienstleister
          für Ihre Projekte zu entdecken.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/registrieren">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Jetzt registrieren
            </Button>
          </Link>
          <Link href="/kontakt">
            <Button variant="outline">Kontakt aufnehmen</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
