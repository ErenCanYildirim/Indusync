import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LocalCompanyState } from "./logo-basics-card";
import { useTranslations } from "next-intl";

type Props = {
  companyData: LocalCompanyState;
  handleInputChange: (
    section: keyof LocalCompanyState,
    field: string,
    value: string | string[] | number
  ) => void;
};

export const TaxCard: React.FC<Props> = ({
  companyData,
  handleInputChange,
}) => {
  const t = useTranslations("Dashboard.companyProfile.tax");
  const { taxInfo } = companyData;
  // Always show tax card

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vatNumber">{t("vatNumber")}</Label>
          <Input
            id="vatNumber"
            value={taxInfo.vatNumber || ""}
            onChange={(e) =>
              handleInputChange("taxInfo", "vatNumber", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="taxId">{t("taxId")}</Label>
          <Input
            id="taxId"
            value={taxInfo.taxId || ""}
            onChange={(e) =>
              handleInputChange("taxInfo", "taxId", e.target.value)
            }
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxCard;
