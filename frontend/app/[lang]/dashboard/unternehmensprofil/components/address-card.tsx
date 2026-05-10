import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogoBasicsCard, LocalCompanyState } from "./logo-basics-card";
import { useTranslations } from "next-intl";

type Props = {
  companyData: LocalCompanyState;
  handleInputChange: (
    section: keyof LocalCompanyState,
    field: string,
    value: string | string[] | number
  ) => void;
};

export const AddressCard: React.FC<Props> = ({
  companyData,
  handleInputChange,
}) => {
  const t = useTranslations("Dashboard.companyProfile.address");
  const { address } = companyData;
  // Always show address card

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="street">{t("street")}</Label>
          <Input
            id="street"
            value={address.street || ""}
            onChange={(e) =>
              handleInputChange("address", "street", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="houseNumber">{t("houseNumber")}</Label>
          <Input
            id="houseNumber"
            value={address.houseNumber || ""}
            onChange={(e) =>
              handleInputChange("address", "houseNumber", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="postalCode">{t("postalCode")}</Label>
          <Input
            id="postalCode"
            value={address.postalCode || ""}
            onChange={(e) =>
              handleInputChange("address", "postalCode", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="city">{t("city")}</Label>
          <Input
            id="city"
            value={address.city || ""}
            onChange={(e) =>
              handleInputChange("address", "city", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="country">{t("country")}</Label>
          <Input
            id="country"
            value={address.country || ""}
            onChange={(e) =>
              handleInputChange("address", "country", e.target.value)
            }
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressCard;
