"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormData } from "@/hooks/use-form-data";
import {
  CompanyRegistrationSchema,
  CompanyFormData,
  CompanyTypeEnum,
} from "@/lib/types/company";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  AddressAutocomplete,
  GeoapifyAddress,
} from "@/components/ui/address-autocomplete";
import { parseGeoapifyAddress, getCityBias } from "@/lib/utils/address-utils";
import { useTranslations } from "next-intl";

const initialCompanyData: CompanyFormData = {
  companyName: "",
  companyType: CompanyTypeEnum.Enum.GMBH, // Default or ensure it's a valid enum
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  country: "Deutschland", // Default
  taxId: "",
  registrationNumber: "",
  contactPersonName: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  agreeTerms: false,
  agreePrivacy: false,
};

export function CompanyRegistrationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("Forms.company");

  const handleSubmitForm = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      console.log("Submitting company registration data:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: t("registrationSuccessful"),
        description: t("registrationSuccessfulDescription"),
        variant: "success",
      });
      // router.push("/dashboard"); // Redirect after successful submission
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    formData,
    formErrors,
    handleInputChange,
    handleCheckboxChange,
    handleSelectChange, // Use this for companyType
    handleSubmit,
    // setFormErrors, // If you need to set errors manually from API response
  } = useFormData<typeof CompanyRegistrationSchema>({
    initialData: initialCompanyData,
    schema: CompanyRegistrationSchema,
    onSubmit: handleSubmitForm,
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("registration")}</CardTitle>
        <CardDescription>{t("registrationDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Company Information */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-semibold px-1">
              {t("companyInformation")}
            </legend>
            <div key="company-name">
              <Label htmlFor="companyName">{t("companyName")}</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder={t("companyNamePlaceholder")}
              />
              {formErrors.companyName && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.companyName}
                </p>
              )}
            </div>
            <div key="company-type">
              <Label htmlFor="companyType">{t("legalForm")}</Label>
              <Select
                name="companyType"
                value={formData.companyType}
                onValueChange={(value) =>
                  handleSelectChange(value, "companyType")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectLegalForm")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GMBH">GmbH</SelectItem>
                  <SelectItem value="AG">AG</SelectItem>
                  <SelectItem value="EINZELUNTERNEHMEN">
                    {t("soleProprietorship")}
                  </SelectItem>
                  <SelectItem value="GBR">{t("gbr")}</SelectItem>
                  <SelectItem value="UG">{t("ug")}</SelectItem>
                  <SelectItem value="OHG">{t("ohg")}</SelectItem>
                  <SelectItem value="KG">{t("kg")}</SelectItem>
                  <SelectItem value="GMBH_CO_KG">{t("gmbhCoKg")}</SelectItem>
                  <SelectItem value="OTHER">{t("other")}</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.companyType && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.companyType}
                </p>
              )}
            </div>
          </fieldset>

          {/* Address Information */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-semibold px-1">
              {t("address")}
            </legend>
            <div className="space-y-4">
              <AddressAutocomplete
                label={t("companyAddress")}
                placeholder={t("streetHouseNumberPlaceholder")}
                value={`${formData.street || ""} ${
                  formData.houseNumber || ""
                }`.trim()}
                onAddressSelect={(address: GeoapifyAddress) => {
                  const parsed = parseGeoapifyAddress(address);
                  // Update form data with parsed address - need to trigger form handlers
                  const streetEvent = {
                    target: { name: "street", value: parsed.street },
                  } as any;
                  const houseNumberEvent = {
                    target: { name: "houseNumber", value: parsed.houseNumber },
                  } as any;
                  const postalCodeEvent = {
                    target: { name: "postalCode", value: parsed.postalCode },
                  } as any;
                  const cityEvent = {
                    target: { name: "city", value: parsed.city },
                  } as any;
                  const countryEvent = {
                    target: { name: "country", value: parsed.country },
                  } as any;

                  handleInputChange(streetEvent);
                  handleInputChange(houseNumberEvent);
                  handleInputChange(postalCodeEvent);
                  handleInputChange(cityEvent);
                  handleInputChange(countryEvent);
                }}
                onInputChange={(value) => {
                  // Handle manual input - parse street and house number
                  const parts = value.split(" ");
                  if (parts.length >= 2) {
                    const lastPart = parts[parts.length - 1];
                    if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
                      const streetEvent = {
                        target: {
                          name: "street",
                          value: parts.slice(0, -1).join(" "),
                        },
                      } as any;
                      const houseNumberEvent = {
                        target: { name: "houseNumber", value: lastPart },
                      } as any;
                      handleInputChange(streetEvent);
                      handleInputChange(houseNumberEvent);
                    } else {
                      const streetEvent = {
                        target: { name: "street", value: value },
                      } as any;
                      const houseNumberEvent = {
                        target: { name: "houseNumber", value: "" },
                      } as any;
                      handleInputChange(streetEvent);
                      handleInputChange(houseNumberEvent);
                    }
                  } else {
                    const streetEvent = {
                      target: { name: "street", value: value },
                    } as any;
                    const houseNumberEvent = {
                      target: { name: "houseNumber", value: "" },
                    } as any;
                    handleInputChange(streetEvent);
                    handleInputChange(houseNumberEvent);
                  }
                }}
                error={!!(formErrors.street || formErrors.houseNumber)}
                errorMessage={formErrors.street || formErrors.houseNumber}
                bias={getCityBias(formData.city || "") || undefined}
              />

              {/* Manual address fields (filled automatically but can be edited) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">{t("postalCode")}</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder={t("postalCodePlaceholder")}
                  />
                  {formErrors.postalCode && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.postalCode}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={t("cityPlaceholder")}
                  />
                  {formErrors.city && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.city}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="country">{t("country")}</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder={t("countryPlaceholder")}
                />
                {formErrors.country && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.country}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Tax and Registration Information */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-semibold px-1">
              {t("taxAndRegistration")}
            </legend>
            <div>
              <Label htmlFor="taxId">{t("vatId")}</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId ?? ""}
                onChange={handleInputChange}
                placeholder={t("vatIdPlaceholder")}
              />
              {formErrors.taxId && (
                <p className="text-sm text-red-500 mt-1">{formErrors.taxId}</p>
              )}
            </div>
            <div>
              <Label htmlFor="registrationNumber">
                {t("commercialRegisterNumber")}
              </Label>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber ?? ""}
                onChange={handleInputChange}
                placeholder={t("commercialRegisterPlaceholder")}
              />
              {formErrors.registrationNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.registrationNumber}
                </p>
              )}
            </div>
          </fieldset>

          {/* Contact Person Information */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-semibold px-1">
              {t("contactPerson")}
            </legend>
            <div>
              <Label htmlFor="contactPersonName">
                {t("contactPersonName")}
              </Label>
              <Input
                id="contactPersonName"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                placeholder={t("contactPersonNamePlaceholder")}
              />
              {formErrors.contactPersonName && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.contactPersonName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPersonEmail">
                {t("contactPersonEmail")}
              </Label>
              <Input
                id="contactPersonEmail"
                name="contactPersonEmail"
                type="email"
                value={formData.contactPersonEmail}
                onChange={handleInputChange}
                placeholder={t("contactPersonEmailPlaceholder")}
              />
              {formErrors.contactPersonEmail && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.contactPersonEmail}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPersonPhone">
                {t("contactPersonPhone")}
              </Label>
              <Input
                id="contactPersonPhone"
                name="contactPersonPhone"
                value={formData.contactPersonPhone ?? ""}
                onChange={handleInputChange}
                placeholder={t("contactPersonPhonePlaceholder")}
              />
              {formErrors.contactPersonPhone && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.contactPersonPhone}
                </p>
              )}
            </div>
          </fieldset>

          {/* Agreements */}
          <div className="space-y-3 pt-4">
            <div key="agree-terms" className="flex items-start space-x-2">
              <Checkbox
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) => {
                  handleCheckboxChange(!!checked, "agreeTerms");
                }}
              />
              <Label htmlFor="agreeTerms" className="text-sm leading-normal">
                {t("agreeTerms", {
                  termsLink: (
                    <Link
                      href="/agb"
                      className="text-primary hover:underline"
                      target="_blank"
                    >
                      {t("termsOfService")}
                    </Link>
                  ),
                })}
              </Label>
            </div>
            {formErrors.agreeTerms && (
              <p className="text-sm text-red-500 -mt-2 ml-6">
                {formErrors.agreeTerms}
              </p>
            )}

            <div key="agree-privacy" className="flex items-start space-x-2">
              <Checkbox
                id="agreePrivacy"
                name="agreePrivacy"
                checked={formData.agreePrivacy}
                onCheckedChange={(checked) => {
                  handleCheckboxChange(!!checked, "agreePrivacy");
                }}
              />
              <Label htmlFor="agreePrivacy" className="text-sm leading-normal">
                {t("agreePrivacy", {
                  privacyLink: (
                    <Link
                      href="/datenschutz"
                      className="text-primary hover:underline"
                      target="_blank"
                    >
                      {t("privacyPolicy")}
                    </Link>
                  ),
                })}
              </Label>
            </div>
            {formErrors.agreePrivacy && (
              <p className="text-sm text-red-500 -mt-2 ml-6">
                {formErrors.agreePrivacy}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              t("register")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
