import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NotFound({
  params,
}: {
  params?: Promise<{ lang: "de" | "en" | undefined }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const isGerman = resolvedParams?.lang === "de";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center p-8 max-w-md w-full">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">
          {isGerman ? "Seite nicht gefunden" : "Page not found"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {isGerman
            ? "Entschuldigung, die von Ihnen gesuchte Seite konnte nicht gefunden werden. Möglicherweise wurde sie verschoben, gelöscht oder existiert nicht."
            : "Sorry, the page you are looking for could not be found. It may have been moved, deleted, or does not exist."}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild variant="outline">
            <Link href={`/${resolvedParams?.lang || "de"}`}>
              {isGerman ? "Zurück zur Startseite" : "Back to Home"}
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/${resolvedParams?.lang || "de"}/kontakt`}>
              {isGerman ? "Support kontaktieren" : "Contact Support"}
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          {isGerman ? "Fehlercode: NOT_FOUND" : "Error Code: NOT_FOUND"}
        </p>
      </div>
    </div>
  );
}
