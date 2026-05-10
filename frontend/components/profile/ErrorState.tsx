"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <div className="space-y-4">
          <div className="text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Profil konnte nicht geladen werden
            </h3>
            <p className="text-muted-foreground mt-1">
              {error || "Ein unbekannter Fehler ist aufgetreten."}
            </p>
          </div>
          <Button onClick={onRetry} variant="outline" className="mt-4">
            Erneut versuchen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
