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

export const ContactCard: React.FC<Props> = ({
  companyData,
  handleInputChange,
}) => {
  const t = useTranslations("Dashboard.companyProfile.contact");
  const { contact } = companyData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            value={contact.phone || ""}
            onChange={(e) =>
              handleInputChange("contact", "phone", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={contact.email || ""}
            onChange={(e) =>
              handleInputChange("contact", "email", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="website">{t("website")}</Label>
          <Input
            id="website"
            value={contact.website || ""}
            onChange={(e) =>
              handleInputChange("contact", "website", e.target.value)
            }
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactCard;
