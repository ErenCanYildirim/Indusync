import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera as CameraIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export type LocalCompanyState = {
  companyId?: string;
  id?: string;
  name: string;
  logo: string;
  description?: string;
  businessHours?: string;
  workRadiusKm?: number;
  specializations?: string[];
  industries?: string[];
  orderCategories?: string[];
  isAuftraggeber?: boolean;
  isAuftragnehmer?: boolean;
  address: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  taxInfo: {
    vatNumber?: string;
    taxId?: string;
  };
};

type Props = {
  companyData: LocalCompanyState;
  handleInputChange: (
    section: keyof LocalCompanyState,
    field: string,
    value: string | string[] | number
  ) => void;
  logo: string | null;
  onPickLogo: () => void;
  isUploadingLogo?: boolean;
};

export const LogoBasicsCard: React.FC<Props> = ({
  companyData,
  handleInputChange,
  logo,
  onPickLogo,
  isUploadingLogo = false,
}) => {
  const t = useTranslations("Dashboard.companyProfile.logoBasics");

  // Always display this card

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-6 sm:space-y-0 sm:space-x-6">
          {/* Logo picker */}
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt="Firmenlogo"
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xl sm:text-3xl font-bold">
                  {companyData.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onPickLogo}
              disabled={isUploadingLogo}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-full disabled:cursor-not-allowed"
            >
              {isUploadingLogo ? (
                <Loader2 className="text-white animate-spin w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <CameraIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Basic fields */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <Label htmlFor="companyName">{t("companyName")}</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => handleInputChange("name", "", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={companyData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", "", e.target.value)
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="businessHours">{t("businessHours")}</Label>
              <Input
                id="businessHours"
                value={companyData.businessHours || ""}
                onChange={(e) =>
                  handleInputChange("businessHours", "", e.target.value)
                }
                placeholder={t("businessHoursPlaceholder")}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Logo upload info */}
        <div className="text-sm text-gray-500 mt-2">
          <p>
            <strong>Logo:</strong> {t("logoUploadInfo")}
            {isUploadingLogo && (
              <span className="text-blue-600 ml-2">
                <Loader2 className="inline w-4 h-4 animate-spin mr-1" />
                {t("uploadingLogo")}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoBasicsCard;
