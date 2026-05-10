import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Edit2 } from "lucide-react";
import { LocalCompanyState } from "./logo-basics-card";

type Props = {
  companyData: LocalCompanyState;
  handleInputChange: (
    section: keyof LocalCompanyState,
    field: string,
    value: string[] | number
  ) => void;
};

export const EditableSpecializationsCard: React.FC<Props> = ({
  companyData,
  handleInputChange,
}) => {
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newOrderCategory, setNewOrderCategory] = useState("");
  const [isEditingRadius, setIsEditingRadius] = useState(false);
  const [tempRadius, setTempRadius] = useState(
    companyData.workRadiusKm?.toString() || ""
  );

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      const current = companyData.specializations || [];
      if (!current.includes(newSpecialization.trim())) {
        handleInputChange("specializations", "", [
          ...current,
          newSpecialization.trim(),
        ]);
      }
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    const current = companyData.specializations || [];
    handleInputChange(
      "specializations",
      "",
      current.filter((s) => s !== spec)
    );
  };

  const addIndustry = () => {
    if (newIndustry.trim()) {
      const current = companyData.industries || [];
      if (!current.includes(newIndustry.trim())) {
        handleInputChange("industries", "", [...current, newIndustry.trim()]);
      }
      setNewIndustry("");
    }
  };

  const removeIndustry = (industry: string) => {
    const current = companyData.industries || [];
    handleInputChange(
      "industries",
      "",
      current.filter((i) => i !== industry)
    );
  };

  const addOrderCategory = () => {
    if (newOrderCategory.trim()) {
      const current = companyData.orderCategories || [];
      if (!current.includes(newOrderCategory.trim())) {
        handleInputChange("orderCategories", "", [
          ...current,
          newOrderCategory.trim(),
        ]);
      }
      setNewOrderCategory("");
    }
  };

  const removeOrderCategory = (category: string) => {
    const current = companyData.orderCategories || [];
    handleInputChange(
      "orderCategories",
      "",
      current.filter((c) => c !== category)
    );
  };

  const saveRadius = () => {
    const radius = parseInt(tempRadius);
    handleInputChange("workRadiusKm", "", isNaN(radius) ? 0 : radius);
    setIsEditingRadius(false);
  };

  const cancelRadiusEdit = () => {
    setTempRadius(companyData.workRadiusKm?.toString() || "");
    setIsEditingRadius(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spezialisierungen & Arbeitsbereich</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work Radius */}
        <div className="space-y-2">
          <Label className="font-medium">Arbeitsradius</Label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {isEditingRadius ? (
              <>
                <Input
                  type="number"
                  value={tempRadius}
                  onChange={(e) => setTempRadius(e.target.value)}
                  placeholder="Radius in km"
                  className="w-full sm:w-32"
                />
                <span className="text-sm text-muted-foreground">km</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveRadius} variant="outline">
                    Speichern
                  </Button>
                  <Button size="sm" onClick={cancelRadiusEdit} variant="ghost">
                    Abbrechen
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="text-lg">
                  {companyData.workRadiusKm
                    ? `${companyData.workRadiusKm} km`
                    : "Nicht angegeben"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingRadius(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Specializations */}
        <div className="space-y-3">
          <Label className="font-medium">Spezialisierungen</Label>
          <div className="flex flex-wrap gap-2">
            {companyData.specializations &&
            companyData.specializations.length > 0 ? (
              companyData.specializations.map((spec, index) => (
                <Badge key={index} variant="outline" className="pr-1">
                  {spec}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeSpecialization(spec)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">
                Keine Spezialisierungen angegeben
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Neue Spezialisierung hinzufügen"
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSpecialization()}
              className="flex-1"
            />
            <Button
              onClick={addSpecialization}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Industries */}
        <div className="space-y-3">
          <Label className="font-medium">Branchen</Label>
          <div className="flex flex-wrap gap-2">
            {companyData.industries && companyData.industries.length > 0 ? (
              companyData.industries.map((industry, index) => (
                <Badge key={index} variant="outline" className="pr-1">
                  {industry}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeIndustry(industry)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">
                Keine Branchen angegeben
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Neue Branche hinzufügen"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addIndustry()}
              className="flex-1"
            />
            <Button
              onClick={addIndustry}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Order Categories */}
        <div className="space-y-3">
          <Label className="font-medium">Auftragskategorien</Label>
          <div className="flex flex-wrap gap-2">
            {companyData.orderCategories &&
            companyData.orderCategories.length > 0 ? (
              companyData.orderCategories.map((category, index) => (
                <Badge key={index} variant="outline" className="pr-1">
                  {category}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeOrderCategory(category)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">
                Keine Kategorien angegeben
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Neue Auftragskategorie hinzufügen"
              value={newOrderCategory}
              onChange={(e) => setNewOrderCategory(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addOrderCategory()}
              className="flex-1"
            />
            <Button
              onClick={addOrderCategory}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Business Roles */}
        <div className="space-y-3">
          <Label className="font-medium">Geschäftsrolle</Label>
          <div className="flex flex-wrap gap-2">
            {companyData.isAuftraggeber && (
              <Badge variant="default">Auftraggeber</Badge>
            )}
            {companyData.isAuftragnehmer && (
              <Badge variant="default">Auftragnehmer</Badge>
            )}
            {!companyData.isAuftraggeber && !companyData.isAuftragnehmer && (
              <span className="text-muted-foreground">
                Keine Rolle angegeben
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Die Geschäftsrollen können nur bei der Registrierung festgelegt
            werden.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableSpecializationsCard;
