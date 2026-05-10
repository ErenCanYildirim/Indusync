"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const specializations = [
  {
    id: "elektrotechnik",
    name: "Elektrotechnik",
    subCategories: [
      { id: "datentechnik", name: "Datentechnik" },
      { id: "automatisierungstechnik", name: "Automatisierungstechnik" },
      { id: "antriebstechnik", name: "Antriebstechnik" },
      { id: "schaltschrankbau", name: "Schaltschrankbau" },
      { id: "beleuchtungstechnik", name: "Beleuchtungstechnik" },
    ],
  },
  {
    id: "programmierung",
    name: "Programmierung",
    subCategories: [
      { id: "sps", name: "SPS" },
      { id: "knx", name: "KNX" },
      { id: "dasy", name: "DASY" },
      { id: "logo", name: "LOGO" },
      { id: "scada", name: "SCADA-Systeme" },
    ],
  },
  {
    id: "mechatronik",
    name: "Mechatronik",
    subCategories: [
      { id: "robotik", name: "Robotik" },
      { id: "hydraulik", name: "Hydraulik" },
      { id: "pneumatik", name: "Pneumatik" },
      { id: "sensortechnik", name: "Sensortechnik" },
    ],
  },
  {
    id: "mechanik",
    name: "Mechanik / Stahlbau / Lackiererei",
    subCategories: [
      { id: "metallbau", name: "Metallbau" },
      { id: "schweissen", name: "Schweißen" },
      { id: "zerspanungstechnik", name: "Zerspanungstechnik" },
      { id: "lackierung", name: "Lackierung" },
      { id: "oberflächentechnik", name: "Oberflächentechnik" },
    ],
  },
  {
    id: "anlagenbau",
    name: "Anlagenbau",
    subCategories: [
      { id: "verfahrenstechnik", name: "Verfahrenstechnik" },
      { id: "prozesstechnik", name: "Prozesstechnik" },
      { id: "fördertechnik", name: "Fördertechnik" },
      { id: "energietechnik", name: "Energietechnik" },
    ],
  },
];

export function ServiceSpecializationSelector({ readOnly = false }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );

  const handleCategoryChange = (categoryId: string) => {
    if (readOnly) return;

    let newSelectedCategories = [...selectedCategories];
    let newSelectedSubCategories = [...selectedSubCategories];

    const category = specializations.find((cat) => cat.id === categoryId);
    if (!category) return;
    const subCategoryIds = category.subCategories.map((sub) => sub.id);

    if (selectedCategories.includes(categoryId)) {
      // Unselect category and all its subcategories
      newSelectedCategories = newSelectedCategories.filter(
        (id) => id !== categoryId
      );
      newSelectedSubCategories = newSelectedSubCategories.filter(
        (id) => !subCategoryIds.includes(id)
      );
    } else {
      // Select category and all its subcategories
      newSelectedCategories.push(categoryId);
      newSelectedSubCategories = [
        ...newSelectedSubCategories,
        ...subCategoryIds,
      ];
    }

    setSelectedCategories(newSelectedCategories);
    setSelectedSubCategories(newSelectedSubCategories);
  };

  const handleSubCategoryChange = (
    subCategoryId: string,
    categoryId: string
  ) => {
    if (readOnly) return;

    let newSelectedSubCategories = [...selectedSubCategories];
    let newSelectedCategories = [...selectedCategories];

    const category = specializations.find((cat) => cat.id === categoryId);
    if (!category) return;
    const subCategoryIds = category.subCategories.map((sub) => sub.id);

    if (selectedSubCategories.includes(subCategoryId)) {
      // Unselect subcategory
      newSelectedSubCategories = newSelectedSubCategories.filter(
        (id) => id !== subCategoryId
      );

      // If no subcategories of this category are selected anymore, unselect the category
      const hasSelectedSubCategories = subCategoryIds.some((id) =>
        newSelectedSubCategories.includes(id)
      );

      if (!hasSelectedSubCategories) {
        newSelectedCategories = newSelectedCategories.filter(
          (id) => id !== categoryId
        );
      }
    } else {
      // Select subcategory
      newSelectedSubCategories.push(subCategoryId);

      // If category is not selected yet, select it
      if (!selectedCategories.includes(categoryId)) {
        newSelectedCategories.push(categoryId);
      }
    }

    setSelectedCategories(newSelectedCategories);
    setSelectedSubCategories(newSelectedSubCategories);
  };

  const isCategorySelected = (categoryId: string) => {
    return selectedCategories.includes(categoryId);
  };

  const isSubCategorySelected = (subCategoryId: string) => {
    return selectedSubCategories.includes(subCategoryId);
  };

  return (
    <div className={cn("space-y-2", readOnly && "pointer-events-none")}>
      <Accordion type="multiple" className="w-full">
        {specializations.map((category) => (
          <AccordionItem key={category.id} value={category.id}>
            <div className="flex items-center">
              <Checkbox
                id={`category-${category.id}`}
                checked={isCategorySelected(category.id)}
                onCheckedChange={() => handleCategoryChange(category.id)}
                className="mr-2 data-[state=checked]:bg-primary"
              />
              <AccordionTrigger className="flex-1 hover:no-underline">
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {category.name}
                </Label>
              </AccordionTrigger>
            </div>
            <AccordionContent>
              <div className="ml-6 space-y-2 mt-2">
                {category.subCategories.map((subCategory) => (
                  <div
                    key={subCategory.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`subcategory-${subCategory.id}`}
                      checked={isSubCategorySelected(subCategory.id)}
                      onCheckedChange={() =>
                        handleSubCategoryChange(subCategory.id, category.id)
                      }
                    />
                    <Label
                      htmlFor={`subcategory-${subCategory.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {subCategory.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
