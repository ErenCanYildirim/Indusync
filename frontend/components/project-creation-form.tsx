"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // For description
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useTranslations, useFormatter } from "next-intl";
import {
  CalendarIcon,
  MapPin,
  User,
  AlertCircle,
  Info,
  DollarSign,
  ListChecks,
  SearchCheck,
} from "lucide-react"; // Added icons
import { ProjectStepper, StepConfig } from "@/components/project-stepper"; // Import StepConfig
import Link from "next/link";
import { useFormData, ValidationErrors } from "@/hooks/use-form-data";
import { useProjects } from "@/hooks/use-projects";
import { CreateProjectSchema, CreateProjectInput } from "@/lib/types/project";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PermissionGuard } from "@/components/PermissionGuard";
import { ProjectBudget } from "@/components/ui/FormattedDisplay";

// Updated response time options - will be translated in component
const responseTimeOptions = [
  { id: "3", labelKey: "responseTime3Days" },
  { id: "7", labelKey: "responseTime7Days" },
  { id: "14", labelKey: "responseTime14Days" },
  { id: "30", labelKey: "responseTime30Days" },
  { id: "30+", labelKey: "responseTimeMore30Days" },
  { id: "custom", labelKey: "responseTimeCustom" },
];

// Mock skills data - replace with actual data source if available
const allSkills = [
  "Elektroinstallation",
  "SPS-Programmierung",
  "Schaltschrankbau",
  "Wartung",
  "Netzwerktechnik",
  "Gebäudeautomation",
  "Photovoltaik",
];

// Extended input type to include properties used in the UI but not in the original type
interface ExtendedProjectInput extends CreateProjectInput {
  radius?: number;
  responseTime?: string;
}

export function ProjectCreationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Forms.project");
  const tValidation = useTranslations("Forms.validation");
  const tCommon = useTranslations("Common");
  const formatter = useFormatter();
  const {
    createProject,
    loading: projectLoading,
    error: projectError,
    clearError: clearProjectError,
  } = useProjects();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUnlimitedRadius, setIsUnlimitedRadius] = useState(false);
  const [customResponseDays, setCustomResponseDays] = useState("");

  const initialData: CreateProjectInput = {
    // Ensure initialData fully matches CreateProjectInput
    title: "",
    description: "",
    location: "",
    postalCode: "",
    budget: undefined,
    deadline: new Date(), // Default to today, or make it undefined and handle in UI
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    requiredSkills: [],
    companyId: "temp-company-id", // Placeholder - this should come from auth or context
  };

  // Extended data for UI elements not in the database schema
  const [uiData, setUiData] = useState({
    radius: 50,
    responseTime: "7",
  });

  const {
    formData,
    formErrors,
    handleInputChange,
    handleDateChange,
    handleCheckboxGroupChange,
    setFormData,
    setFormErrors,
    // validateField, // Not using for now, step validation is custom
  } = useFormData<typeof CreateProjectSchema>({
    initialData: initialData,
    schema: CreateProjectSchema,
  });

  // Handle UI specific data
  const handleUiDataChange = (
    field: keyof typeof uiData,
    value: string | number
  ) => {
    setUiData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle budget specifically as it's a number
  const handleBudgetChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev: CreateProjectInput) => ({
      ...prev,
      budget: value === "" ? undefined : parseFloat(value),
    }));
  };

  // Handle radius specifically
  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    const isUnlimited = newRadius === 300;

    setIsUnlimitedRadius(isUnlimited);
    handleUiDataChange("radius", newRadius);
  };

  // Handle response time change
  const handleResponseTimeChange = (value: string) => {
    handleUiDataChange("responseTime", value);
  };

  // Handle custom response days
  const handleCustomResponseDaysChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomResponseDays(e.target.value);
  };

  const nextStep = async () => {
    clearProjectError();
    let currentFieldsToValidate: (keyof CreateProjectInput)[] = [];
    if (currentStep === 0) {
      currentFieldsToValidate = [
        "title",
        "description",
        "contactPerson",
        "contactEmail",
        "contactPhone",
      ];
    } else if (currentStep === 1) {
      currentFieldsToValidate = ["location", "postalCode", "budget"];
    } else if (currentStep === 2) {
      currentFieldsToValidate = ["deadline", "requiredSkills"];
    }

    let stepIsValid = true;
    const newErrors: ValidationErrors<CreateProjectInput> = { ...formErrors }; // Preserve existing errors

    for (const field of currentFieldsToValidate) {
      try {
        // Use .shape to access individual field schemas for partial validation
        CreateProjectSchema.shape[
          field as keyof typeof CreateProjectSchema.shape
        ].parse(formData[field]);
        newErrors[field] = undefined; // Clear error for this field
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors[field] = e.errors[0].message;
          stepIsValid = false;
        }
      }
    }
    setFormErrors(newErrors);

    if (stepIsValid && currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else if (!stepIsValid) {
      toast({
        title: tValidation("validationError"),
        description: tValidation("validationErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    clearProjectError();

    try {
      const parsedData = CreateProjectSchema.parse(formData); // Full validation on submit
      const createdProject = await createProject(parsedData);

      if (createdProject) {
        toast({
          title: t("orderCreated"),
          description: t("orderCreatedDescription", {
            title: createdProject.title,
          }),
          variant: "success",
        });
        router.push("/dashboard/auftraege");
      } else {
        let errorDesc = t("unknownCreationError");
        if (projectError instanceof Error) {
          errorDesc = projectError.message;
        } else if (
          typeof projectError === "string" &&
          projectError.trim() !== ""
        ) {
          errorDesc = projectError;
        }
        toast({
          title: t("creationError"),
          description: errorDesc,
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationErrors<CreateProjectInput> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as keyof CreateProjectInput] = err.message;
          }
        });
        setFormErrors(errors);
        toast({
          title: tValidation("validationError"),
          description: tValidation("checkAllInputs"),
          variant: "destructive",
        });
      } else {
        toast({
          title: tValidation("unexpectedError"),
          description: tValidation("unexpectedErrorDescription"),
          variant: "destructive",
        });
        console.error("Unexpected error:", error);
      }
    }
  };

  useEffect(() => {
    if (projectError) {
      let description = tValidation("unexpectedErrorDescription");
      if (projectError instanceof Error) {
        description = projectError.message;
      } else if (
        typeof projectError === "string" &&
        projectError.trim() !== ""
      ) {
        description = projectError;
      }
      toast({
        title: tCommon("status.error"),
        description: description,
        variant: "destructive",
      });
    }
  }, [projectError, toast, tValidation, tCommon]);

  const projectCreationSteps: StepConfig[] = [
    { id: "step1", name: t("title"), icon: Info },
    { id: "step2", name: t("locationAndBudget"), icon: DollarSign },
    { id: "step3", name: t("timeAndSkills"), icon: ListChecks },
    { id: "step4", name: t("reviewAndSubmit"), icon: SearchCheck },
  ];

  const getRadiusDisplayText = () => {
    if (isUnlimitedRadius) {
      return t("unlimited");
    }
    return `${uiData.radius} km`;
  };

  return (
    <PermissionGuard
      permission="CREATE_ORDERS"
      fallback={
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">
            {tCommon("actions.unauthorized")}
          </h2>
          <p className="text-muted-foreground">
            {tCommon("actions.unauthorizedDescription")}
          </p>
        </div>
      }
    >
      <form onSubmit={submitForm} className="space-y-8">
        <ProjectStepper
          currentStep={currentStep}
          steps={projectCreationSteps}
        />

        <div className="mt-8">
          {currentStep === 0 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold mb-6">{t("title")}</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-base">
                      {t("projectName")}
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={t("projectNamePlaceholder")}
                      className="mt-2"
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.title}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-base">
                      {t("description")}
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t("descriptionPlaceholder")}
                      className="mt-2"
                      rows={4}
                    />
                    {formErrors.description && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contactPerson" className="text-base">
                      {t("contactPerson")}
                    </Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder={t("contactPersonPlaceholder")}
                      className="mt-2"
                    />
                    {formErrors.contactPerson && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.contactPerson}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="contactEmail" className="text-base">
                        {t("email")}
                      </Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        placeholder={t("emailPlaceholder")}
                        className="mt-2"
                      />
                      {formErrors.contactEmail && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.contactEmail}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="contactPhone" className="text-base">
                        {t("phone")}
                      </Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone ?? ""}
                        onChange={handleInputChange}
                        placeholder="+49 123 456789"
                        className="mt-2"
                      />
                      {formErrors.contactPhone && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold mb-6">
                  {t("locationAndBudget")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="location" className="text-base">
                      {t("workLocation")}
                    </Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder={t("workLocationPlaceholder")}
                        className="pl-10 mt-2"
                      />
                    </div>
                    {formErrors.location && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="text-base">
                      {t("postalCode")}
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder={t("postalCodePlaceholder")}
                      className="mt-2"
                    />
                    {formErrors.postalCode && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.postalCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-base">
                      {t("maxDistance")} ({getRadiusDisplayText()})
                    </Label>
                    <Slider
                      defaultValue={[uiData.radius]}
                      max={300}
                      step={10}
                      onValueChange={handleRadiusChange}
                      className="mt-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 km</span>
                      <span>150 km</span>
                      <span>{t("unlimited")}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="budget" className="text-base">
                      {t("budget")}
                    </Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      value={formData.budget ?? ""}
                      onChange={handleBudgetChange}
                      placeholder={t("budgetPlaceholder")}
                      className="mt-2"
                    />
                    {formErrors.budget && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.budget}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold mb-6">
                  {t("timeAndSkills")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base">{t("dueDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-2",
                            !formData.deadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.deadline
                            ? format(formData.deadline, "PPP", { locale: de })
                            : t("selectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.deadline}
                          onSelect={(date) =>
                            handleDateChange(date || undefined, "deadline")
                          }
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.deadline && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.deadline}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-base">{t("responseTime")}</Label>
                    <RadioGroup
                      value={uiData.responseTime}
                      onValueChange={handleResponseTimeChange}
                      className="mt-2 space-y-2"
                    >
                      {responseTimeOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`response-${option.id}`}
                          />
                          <Label
                            htmlFor={`response-${option.id}`}
                            className="font-normal"
                          >
                            {t(option.labelKey)}
                          </Label>

                          {option.id === "custom" &&
                            uiData.responseTime === "custom" && (
                              <Input
                                className="ml-2 w-24"
                                type="number"
                                min="1"
                                placeholder={t("customDaysPlaceholder")}
                                value={customResponseDays}
                                onChange={handleCustomResponseDaysChange}
                              />
                            )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-base">{t("requiredSkills")}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {allSkills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`skill-${skill}`}
                            checked={formData.requiredSkills.includes(skill)}
                            onCheckedChange={(checked) =>
                              handleCheckboxGroupChange(
                                skill,
                                "requiredSkills",
                                !!checked
                              )
                            }
                          />
                          <Label
                            htmlFor={`skill-${skill}`}
                            className="font-normal"
                          >
                            {skill}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formErrors.requiredSkills && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.requiredSkills}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold mb-6">
                  {t("reviewAndSubmit")}
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="text-base font-medium mb-2 flex items-center">
                      <User className="mr-2 h-5 w-5 text-primary" />
                      {t("projectInformation")}
                    </h3>
                    <p>
                      <strong>{t("title")}:</strong> {formData.title}
                    </p>
                    <p>
                      <strong>{t("description")}:</strong>{" "}
                      {formData.description}
                    </p>
                    <p>
                      <strong>{t("contactPersonLabel")}:</strong>{" "}
                      {formData.contactPerson}
                    </p>
                    <p>
                      <strong>{t("emailLabel")}:</strong>{" "}
                      {formData.contactEmail}
                    </p>
                    <p>
                      <strong>{t("phoneLabel")}:</strong>{" "}
                      {formData.contactPhone ?? "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="text-base font-medium mb-2 flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-primary" />
                      {t("locationAndBudgetLabel")}
                    </h3>
                    <p>
                      <strong>{t("location")}:</strong> {formData.location}
                    </p>
                    <p>
                      <strong>{t("postalCodeLabel")}:</strong>{" "}
                      {formData.postalCode}
                    </p>
                    <p>
                      <strong>{t("maxDistanceLabel")}:</strong>{" "}
                      {getRadiusDisplayText()}
                    </p>
                    <p>
                      <strong>{t("budgetLabel")}:</strong>{" "}
                      <ProjectBudget
                        amount={formData.budget}
                        fallbackText="N/A"
                      />
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="text-base font-medium mb-2 flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                      {t("timeAndSkillsLabel")}
                    </h3>
                    <p>
                      <strong>{t("dueDateLabel")}:</strong>{" "}
                      {formData.deadline
                        ? format(formData.deadline, "PPP", { locale: de })
                        : "N/A"}
                    </p>
                    <p>
                      <strong>{t("responseTimeLabel")}:</strong>{" "}
                      {uiData.responseTime === "custom"
                        ? `${customResponseDays || "0"} ${tCommon("time.days")}`
                        : t(
                            responseTimeOptions.find(
                              (opt) => opt.id === uiData.responseTime
                            )?.labelKey ?? "responseTime7Days"
                          )}
                    </p>
                    <p>
                      <strong>{t("skillsLabel")}:</strong>{" "}
                      {formData.requiredSkills.join(", ") ||
                        t("noSkillsSpecified")}
                    </p>
                  </div>
                  {projectError && (
                    <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <p className="text-sm">
                        {(() => {
                          if (projectError instanceof Error)
                            return projectError.message;
                          if (
                            typeof projectError === "string" &&
                            projectError.trim() !== ""
                          )
                            return projectError;
                          return "Ein Fehler ist aufgetreten.";
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="w-full sm:w-auto"
            >
              {tCommon("actions.back")}
            </Button>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button type="button" variant="ghost" className="w-full">
                {tCommon("actions.cancel")}
              </Button>
            </Link>
          </div>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="w-full sm:w-auto"
            >
              {tCommon("actions.next")}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={projectLoading}
              className="w-full sm:w-auto"
            >
              {projectLoading ? t("creatingOrder") : t("createOrder")}
            </Button>
          )}
        </div>
      </form>
    </PermissionGuard>
  );
}
