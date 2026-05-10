import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CompanyData = {
  workRadiusKm?: number;
  specializations?: string[];
  industries?: string[];
  orderCategories?: string[];
  isAuftraggeber?: boolean;
  isAuftragnehmer?: boolean;
};

type Props = {
  company: CompanyData;
};

export const SpecializationsCard: React.FC<Props> = ({ company }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spezialisierungen & Arbeitsbereich</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="font-medium">Arbeitsradius: {company.workRadiusKm ? `${company.workRadiusKm} km` : "Nicht angegeben"}</div>
          
          <div>
            <div className="font-medium mb-1">Spezialisierungen:</div>
            <div className="flex flex-wrap gap-2">
              {company.specializations && company.specializations.length > 0 ? (
                company.specializations.map((spec, index) => (
                  <Badge key={index} variant="outline">{spec}</Badge>
                ))
              ) : (
                <div className="text-gray-500">Keine Spezialisierungen angegeben</div>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-medium mb-1">Branchen:</div>
            <div className="flex flex-wrap gap-2">
              {company.industries && company.industries.length > 0 ? (
                company.industries.map((industry, index) => (
                  <Badge key={index} variant="outline">{industry}</Badge>
                ))
              ) : (
                <div className="text-gray-500">Keine Branchen angegeben</div>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-medium mb-1">Auftragskategorien:</div>
            <div className="flex flex-wrap gap-2">
              {company.orderCategories && company.orderCategories.length > 0 ? (
                company.orderCategories.map((category, index) => (
                  <Badge key={index} variant="outline">{category}</Badge>
                ))
              ) : (
                <div className="text-gray-500">Keine Kategorien angegeben</div>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-medium mb-1">Rolle:</div>
            <div className="flex flex-wrap gap-2">
              {company.isAuftraggeber && (
                <Badge variant="default">Auftraggeber</Badge>
              )}
              {company.isAuftragnehmer && (
                <Badge variant="default">Auftragnehmer</Badge>
              )}
              {!company.isAuftraggeber && !company.isAuftragnehmer && (
                <div className="text-gray-500">Keine Rolle angegeben</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpecializationsCard;
