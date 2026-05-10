"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PublicOnly } from "@/components/RouteProtection";
import { RegistrationStepper } from "@/components/registration-stepper";
import { useFormData, ValidationErrors } from "@/hooks/use-form-data";
import {
  RegistrationSchema,
  BaseRegistrationSchema, // Import BaseRegistrationSchema
  RegistrationFormData,
} from "@/lib/types/registration";
import { messages } from "@/lib/validation"; // Import messages
import { type User } from "@/lib/api";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("Registration");
  const currentLocale = useLocale();
  const router = useRouter();
  const { register, registerError, isRegisterLoading } = useAuth();
  const { toast } = useToast();

  const initialValues: RegistrationFormData = {
    // === Core Identity ===
    accountType: "business",
    email: "",
    password: "",
    confirmPassword: "",

    // === Personal Information ===
    firstName: "",
    lastName: "",
    phone: "",
    website: "",

    // === Company Information ===
    companyName: "",
    companyType: "",
    taxId: "",
    registrationNumber: "",

    // === Address Fields ===
    street: "", // Maps to street in backend
    houseNumber: "",
    postalCode: "",
    city: "",
    country: "Deutschland", // Default to Germany

    // === Location Coordinates ===
    latitude: undefined,
    longitude: undefined,

    // === Business-specific Fields ===
    workRadiusKm: undefined,
    specializations: [],
    industries: [],
    orderCategories: [],
    description: "",

    // === Role Flags ===
    companyTypeAuftraggeber: false,
    companyTypeAuftragnehmer: false,

    // === Auftragnehmer-specific Fields ===
    companyDetailsName: "",
    companyAddress: "",
    companyPostalCode: "",
    companyCity: "",
    workRadius: "",
    countrySelection: "",
    contactPersonCount: undefined,
    contactPersonName: "",
    contactDepartment: "",
    contactEmail: "",
    contactPhone: "",
    employeeCount: undefined,
    companyDescription: "",

    // === User Preferences ===
    referralSource: "",
    interests: [],
    emailNotifications: true,

    // === Terms and Privacy ===
    termsAccepted: false,
    privacyAccepted: false,

    // === File Objects (added to initialValues) ===
    _verificationFile: undefined,
    _certificatesFile: undefined,
  };

  const handleFormSubmit = async (data: RegistrationFormData) => {
    try {
      let validatedData;
      try {
        validatedData = RegistrationSchema.parse(data);
      } catch (validationError) {
        // For now, let's still try to submit with basic validation
        // Check only the absolutely critical fields
        if (!data.email || !data.password || !data.confirmPassword) {
          throw new Error(t("validation.emailPasswordRequired"));
        }

        if (data.password !== data.confirmPassword) {
          throw new Error(t("validation.passwordMismatch"));
        }

        if (!data.termsAccepted || !data.privacyAccepted) {
          throw new Error(t("validation.termsPrivacyRequired"));
        }

        // Use the original data if validation fails
        validatedData = data;
        console.log("⚠️ Using original data despite validation errors");
      }

      // Map to our new RegisterRequest interface with proper data type conversion
      // Use actual formData instead of potentially incomplete validatedData
      const registerRequest = {
        // === Core Identity ===
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        accountType: data.accountType.toUpperCase() as "PERSONAL" | "BUSINESS",

        // === Personal Information ===
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        website: data.website,

        // === Company Information ===
        companyName: data.companyName,
        companyType: data.companyType?.toUpperCase() as any,
        taxId: data.taxId,
        registrationNumber: data.registrationNumber,

        // === Address Fields ===
        street: data.street, // Fixed field name mapping
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,

        // === Location Coordinates ===
        latitude: data.latitude,
        longitude: data.longitude,

        // === Business-specific Fields ===
        workRadiusKm: data.workRadiusKm,
        specializations: data.specializations || [], // Use current form data
        industries: data.industries || [],
        orderCategories: data.orderCategories || [],
        description: data.description,

        // === Role Flags ===
        companyTypeAuftraggeber: data.companyTypeAuftraggeber,
        companyTypeAuftragnehmer: data.companyTypeAuftragnehmer,

        // === Auftragnehmer-specific Fields ===
        companyDetailsName: data.companyDetailsName,
        companyAddress: data.companyAddress,
        companyPostalCode: data.companyPostalCode,
        companyCity: data.companyCity,
        workRadius: data.workRadius,
        countrySelection: data.countrySelection,
        // Convert string numbers to actual numbers
        contactPersonCount: data.contactPersonCount
          ? parseInt(String(data.contactPersonCount), 10)
          : undefined,
        contactPersonName: data.contactPersonName,
        contactDepartment: data.contactDepartment,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        // Convert string numbers to actual numbers
        employeeCount: data.employeeCount
          ? parseInt(String(data.employeeCount), 10)
          : undefined,
        companyDescription: data.companyDescription,

        // === User Preferences ===
        emailNotifications: data.emailNotifications,
        interests: data.interests,
        referralSource: data.referralSource,

        // === Terms and Privacy (CRITICAL - Required by backend) ===
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
      };

      console.log("🚀 About to call register with:", registerRequest);

      // Extract file objects from form data (stored by RegistrationStepper)
      const verificationFile = (data as any)._verificationFile as File | null;
      const certificatesFile = (data as any)._certificatesFile as File | null;

      // Prepare files object for API
      const files: { verificationFile?: File; certificatesFile?: File } = {};
      if (verificationFile) {
        files.verificationFile = verificationFile;
        console.log("📎 Including verification file:", verificationFile.name);
      }
      if (certificatesFile) {
        files.certificatesFile = certificatesFile;
        console.log("📎 Including certificates file:", certificatesFile.name);
      }

      // Call the register function with data and files
      register({
        data: registerRequest,
        files: Object.keys(files).length > 0 ? files : undefined,
      });

      toast({
        variant: "success",
        title: t("success.title"),
        description: t("success.description"),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const zodErrors: ValidationErrors<RegistrationFormData> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            zodErrors[err.path[0] as keyof RegistrationFormData] = err.message;
          }
        });
        setFormErrors(zodErrors);
        toast({
          variant: "destructive",
          title: t("error.validationTitle"),
          description: t("error.validationDescription"),
        });
      } else {
        const errorMessage =
          error.message ??
          (registerError as any)?.response?.data?.message ??
          (registerError as any)?.message ??
          t("error.registrationFailed");

        toast({
          variant: "destructive",
          title: t("error.registrationTitle"),
          description: errorMessage,
        });
      }
    }
  };

  const {
    formData,
    formErrors,
    handleInputChange,
    handleCheckboxChange,
    handleSelectChange,
    handleSubmit,
    setFormData,
    setFormErrors,
    handleBlur,
  } = useFormData<typeof BaseRegistrationSchema>({
    // Use BaseRegistrationSchema for the hook
    initialData: initialValues,
    schema: BaseRegistrationSchema, // Pass the base Zod schema
    onSubmit: handleFormSubmit,
  });

  const handleStepValidate = (fieldsToValidate: string[]): boolean => {
    let stepIsValid = true;
    const currentStepValidationErrors: ValidationErrors<RegistrationFormData> =
      {};
    const validatableFields =
      fieldsToValidate as (keyof RegistrationFormData)[];

    // Validate password confirmation first
    if (validatableFields.includes("confirmPassword")) {
      if (formData.password !== formData.confirmPassword) {
        currentStepValidationErrors.confirmPassword = messages.passwordMatch;
        stepIsValid = false;
      }
    }

    // Validate terms and privacy
    if (validatableFields.includes("termsAccepted")) {
      if (!formData.termsAccepted) {
        currentStepValidationErrors.termsAccepted = t(
          "validation.termsRequired"
        );
        stepIsValid = false;
      }
    }
    if (validatableFields.includes("privacyAccepted")) {
      if (!formData.privacyAccepted) {
        currentStepValidationErrors.privacyAccepted = t(
          "validation.privacyRequired"
        );
        stepIsValid = false;
      }
    }

    // Validate required fields for each step
    validatableFields.forEach((field) => {
      const value = formData[field];

      // Check if field is required and empty
      if (
        isFieldRequired(field, formData) &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        currentStepValidationErrors[field] = t("validation.fieldRequired", {
          field: getFieldLabel(field),
        });
        stepIsValid = false;
      }

      // Additional specific validations
      if (field === "email" && value && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          currentStepValidationErrors[field] = t("validation.invalidEmail");
          stepIsValid = false;
        }
      }

      if (field === "password" && value && typeof value === "string") {
        if (value.length < 8) {
          currentStepValidationErrors[field] = t("validation.passwordLength");
          stepIsValid = false;
        }
      }

      if (field === "phone" && value && typeof value === "string") {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          currentStepValidationErrors[field] = t("validation.invalidPhone");
          stepIsValid = false;
        }
      }

      if (field === "postalCode" && value && typeof value === "string") {
        const postalCodeRegex = /^[0-9]{5}$/;
        if (!postalCodeRegex.test(value)) {
          currentStepValidationErrors[field] = t(
            "validation.invalidPostalCode"
          );
          stepIsValid = false;
        }
      }
    });

    // Update form errors
    setFormErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      validatableFields.forEach((field) => {
        delete updatedErrors[field];
      });
      return { ...updatedErrors, ...currentStepValidationErrors };
    });

    // Show validation feedback
    if (!stepIsValid) {
      const errorCount = Object.keys(currentStepValidationErrors).length;
      const errorFields = Object.keys(currentStepValidationErrors)
        .map((field) => getFieldLabel(field as keyof RegistrationFormData))
        .join(", ");

      toast({
        variant: "destructive",
        title: t("validation.validationErrorsTitle", { count: errorCount }),
        description: t("validation.validationErrorsDescription", {
          fields: errorFields,
        }),
      });
    } else {
      toast({
        variant: "default",
        title: t("validation.stepValidatedTitle"),
        description: t("validation.stepValidatedDescription"),
      });
    }

    return stepIsValid;
  };

  // Helper function to determine if a field is required
  const isFieldRequired = (
    field: keyof RegistrationFormData,
    data: RegistrationFormData
  ): boolean => {
    switch (field) {
      case "email":
      case "password":
      case "confirmPassword":
        return true;
      case "companyName":
      case "companyType":
        return data.accountType === "business";
      case "firstName":
      case "lastName":
        return data.accountType === "personal";
      case "street":
      case "postalCode":
      case "city":
      case "phone":
        return true;
      case "companyDetailsName":
      case "companyAddress":
      case "companyPostalCode":
      case "companyCity":
      case "employeeCount":
      case "companyDescription":
        return data.companyTypeAuftragnehmer === true;
      case "termsAccepted":
      case "privacyAccepted":
        return true;
      default:
        return false;
    }
  };

  // Helper function to get user-friendly field labels
  const getFieldLabel = (field: keyof RegistrationFormData): string => {
    const labels: Record<string, string> = {
      email: t("fields.email"),
      password: t("fields.password"),
      confirmPassword: t("fields.confirmPassword"),
      companyName: t("fields.companyName"),
      companyType: t("fields.companyType"),
      firstName: t("fields.firstName"),
      lastName: t("fields.lastName"),
      street: t("fields.street"),
      postalCode: t("fields.postalCode"),
      city: t("fields.city"),
      phone: t("fields.phone"),
      companyDetailsName: t("fields.companyDetailsName"),
      companyAddress: t("fields.companyAddress"),
      companyPostalCode: t("fields.companyPostalCode"),
      companyCity: t("fields.companyCity"),
      employeeCount: t("fields.employeeCount"),
      companyDescription: t("fields.companyDescription"),
      termsAccepted: t("fields.termsAccepted"),
      privacyAccepted: t("fields.privacyAccepted"),
    };
    return labels[field] || field;
  };

  const onFormCheckboxChange = (
    checked: boolean,
    name: keyof RegistrationFormData
  ) => {
    handleCheckboxChange(checked, name);
  };

  const handleInterestChange = (checked: boolean, interestValue: string) => {
    const currentInterests = formData.interests || [];
    const newInterests = checked
      ? [...currentInterests, interestValue]
      : currentInterests.filter((i) => i !== interestValue);
    setFormData((prev) => ({ ...prev, interests: newInterests }));
  };

  useEffect(() => {
    if (registerError) {
      toast({
        variant: "destructive",
        title: t("error.registrationTitle"),
        description:
          (registerError as any)?.response?.data?.message ||
          (registerError as any)?.message ||
          t("error.registrationFailed"),
      });
    }
  }, [registerError, toast, t]);

  return (
    <PublicOnly>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-30 w-full border-b bg-card">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-semibold text-xl tracking-tight">
                <span className="text-foreground font-bold">Indusync</span>
                <span className="text-primary"></span>
              </Link>
              <MainNav />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  {t("login")}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 container py-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-8">
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("back")}</span>
                </Link>
              </Button>
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
                {t("register")}
              </h1>
              <p className="text-muted-foreground">{t("description")}</p>
            </div>

            <div className="flex justify-center mb-6">
              {/* RadioGroup removed, accountType is fixed to "business" */}
              {/* You might want to display this information if it's important for the user to know */}
              {/* For example:
             <p className="text-muted-foreground">
               {t("registeringAsBusiness")}
             </p>
             */}
            </div>

            {registerError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(registerError as any)?.response?.data?.message ||
                    (registerError as any)?.message ||
                    t("error.registrationFailed")}
                </AlertDescription>
              </Alert>
            )}

            <RegistrationStepper
              accountType={formData.accountType}
              formData={formData}
              formErrors={formErrors}
              isSubmitting={isRegisterLoading}
              termsAccepted={formData.termsAccepted} // Pass directly from formData
              privacyAccepted={formData.privacyAccepted} // Pass directly from formData
              onInputChange={handleInputChange}
              // Assuming RegistrationStepper's onCheckboxChange matches this signature:
              // (checked: boolean, name: string /* field name */, isInterest?: boolean)
              // We need to adapt our onFormCheckboxChange or the stepper's expectation.
              // For now, let's assume RegistrationStepper can take a simpler onCheckboxChange for terms/privacy.
              onCheckboxChange={(checked, name, isInterest) => {
                if (isInterest) {
                  handleInterestChange(checked, name); // 'name' here is the interest value/id
                } else {
                  // For termsAccepted, privacyAccepted, emailNotifications, newsletter
                  onFormCheckboxChange(
                    checked,
                    name as keyof RegistrationFormData
                  );
                }
              }}
              // onInterestChange is removed as RegistrationStepper uses onCheckboxChange with isInterest flag
              onSelectChange={(value, name) =>
                handleSelectChange(value, name as keyof RegistrationFormData)
              }
              onStepSubmit={handleStepValidate} // Corrected prop name
              // RegistrationStepper expects setTermsAccepted and setPrivacyAccepted.
              // We will use our handleCheckboxChange from useFormData for these.
              setTermsAccepted={(value) =>
                handleCheckboxChange(value, "termsAccepted")
              }
              setPrivacyAccepted={(value) =>
                handleCheckboxChange(value, "privacyAccepted")
              }
              // currentStep and setCurrentStep are managed internally by RegistrationStepper
              // The RegistrationStepper also expects onBlur and formTouched.
              // useFormData doesn't provide these directly in the same way.
              // We can pass a dummy onBlur or modify RegistrationStepper if it's critical.
              // For formTouched, we can derive it or omit if not strictly needed for display.
              // For now, let's add a simple onBlur and pass formErrors as a proxy for touched (if error exists, it was touched).
              onFieldBlur={(fieldName: string) =>
                handleBlur(fieldName as keyof RegistrationFormData)
              }
              formTouched={formErrors}
              onSubmit={handleSubmit}
              setFormData={setFormData}
            />

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("alreadyRegistered")}{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  {t("hereLogin")}
                </Link>
              </p>
            </div>
          </div>
        </main>

        <footer className="border-t border-border py-6 md:py-8">
          <div className="container flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Indusync. {t("footer.rights")}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/datenschutz"
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                href="/agb"
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                {t("footer.terms")}
              </Link>
              <Link
                href="/impressum"
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                {t("footer.imprint")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </PublicOnly>
  );
}
