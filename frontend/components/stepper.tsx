"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle,
  MapPin,
  Info,
  ClipboardCheck,
  FileText,
} from "lucide-react";

interface StepperProps {
  currentStep: number;
}

export function Stepper({ currentStep }: Readonly<StepperProps>) {
  const steps = [
    {
      id: "step-1",
      name: "Projektinformationen",
      icon: Info,
    },
    {
      id: "step-2",
      name: "Dokumente",
      icon: FileText,
    },
    {
      id: "step-3",
      name: "Anforderungen",
      icon: ClipboardCheck,
    },
    {
      id: "step-4",
      name: "Ort & Zeitraum",
      icon: MapPin,
    },
    {
      id: "step-5",
      name: "Überprüfen",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white text-sm font-semibold",
                  index <= currentStep
                    ? "border-primary text-primary"
                    : "border-gray-200 text-gray-400"
                )}
              >
                <step.icon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-between">
          {steps.map((step, index) => (
            <div
              key={`label-${step.id}`}
              className={cn(
                "w-32 text-center text-sm font-medium",
                index <= currentStep ? "text-primary" : "text-gray-500"
              )}
            >
              {step.name}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white",
                "border-primary text-primary"
              )}
            >
              {(() => {
                const StepIcon = steps[currentStep]?.icon;
                return StepIcon ? <StepIcon className="h-5 w-5" /> : null;
              })()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-primary">
                Schritt {currentStep + 1} von {steps.length}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {steps[currentStep]?.name}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {currentStep + 1}/{steps.length}
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
