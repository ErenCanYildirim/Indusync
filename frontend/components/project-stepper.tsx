"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react" // Added more icons

export interface StepConfig {
  id: string;
  name: string;
  icon: LucideIcon;
}
interface ProjectStepperProps {
  currentStep: number;
  steps: StepConfig[];
}

export function ProjectStepper({ currentStep, steps }: Readonly<ProjectStepperProps>) {
  // Default icons if needed, or ensure ProjectCreationForm passes them.
  // For now, we assume ProjectCreationForm will pass the full StepConfig.

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
                  index <= currentStep ? "border-primary text-primary" : "border-gray-200 text-gray-400",
                )}
              >
                {React.createElement(step.icon, { className: "h-5 w-5" })}
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
                index <= currentStep ? "text-primary" : "text-gray-500",
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
                "border-primary text-primary",
              )}
            >
              {steps[currentStep] && React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-primary">
                Schritt {currentStep + 1} von {steps.length}
              </p>
              <p className="text-sm font-medium text-gray-900">{steps[currentStep]?.name}</p>
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
  )
}
