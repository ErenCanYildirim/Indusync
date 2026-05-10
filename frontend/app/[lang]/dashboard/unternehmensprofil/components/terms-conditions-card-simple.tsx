"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface TermsConditionsCardSimpleProps {
  companyId: string;
  companyName?: string;
}

export function TermsConditionsCardSimple({
  companyId,
  companyName = "",
}: TermsConditionsCardSimpleProps) {
  console.log("TermsConditionsCardSimple rendering with companyId:", companyId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Terms & Conditions (Simple Test)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Company ID: {companyId}</p>
        <p>Company Name: {companyName}</p>
        <p>
          This is a simplified test version of the T&C card to verify rendering
          works.
        </p>
      </CardContent>
    </Card>
  );
}

export default TermsConditionsCardSimple;
