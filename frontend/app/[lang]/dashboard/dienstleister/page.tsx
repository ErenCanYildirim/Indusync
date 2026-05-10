"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Users, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

// Import DataTable and dienstleister columns
import { DataTable } from "@/components/ui/data-table";
import {
  useDienstleisterColumns,
  DienstleisterData,
} from "@/components/tables/dienstleister-columns";

// Mock data for service providers - replace with actual API call
const mockServiceProviders: DienstleisterData[] = [
  {
    id: "1",
    companyName: "TechSolutions GmbH",
    contactPerson: "Max Mustermann",
    email: "max@techsolutions.de",
    phone: "+49 123 456789",
    location: {
      city: "Berlin",
      postalCode: "10115",
      country: "Deutschland",
    },
    specializations: ["Web Development", "Mobile Apps", "Cloud Services"],
    rating: 4.8,
    reviewCount: 24,
    status: "ACTIVE",
    joinedAt: "2023-01-15T10:00:00Z",
    lastActive: "2024-01-20T14:30:00Z",
    completedProjects: 18,
    responseTime: "2 Stunden",
    verified: true,
  },
  {
    id: "2",
    companyName: "Digital Experts",
    contactPerson: "Anna Schmidt",
    email: "anna@digitalexperts.de",
    phone: "+49 987 654321",
    location: {
      city: "München",
      postalCode: "80331",
      country: "Deutschland",
    },
    specializations: ["E-Commerce", "SEO", "Digital Marketing"],
    rating: 4.6,
    reviewCount: 15,
    status: "ACTIVE",
    joinedAt: "2023-03-10T09:00:00Z",
    lastActive: "2024-01-19T16:45:00Z",
    completedProjects: 12,
    responseTime: "4 Stunden",
    verified: true,
  },
  {
    id: "3",
    companyName: "Creative Studio",
    contactPerson: "Thomas Weber",
    email: "thomas@creativestudio.de",
    phone: "+49 555 123456",
    location: {
      city: "Hamburg",
      postalCode: "20095",
      country: "Deutschland",
    },
    specializations: ["Design", "Branding", "UI/UX"],
    rating: 4.2,
    reviewCount: 8,
    status: "INACTIVE",
    joinedAt: "2022-11-05T11:30:00Z",
    lastActive: "2023-12-15T13:20:00Z",
    completedProjects: 6,
    responseTime: "1 Tag",
    verified: false,
  },
  {
    id: "4",
    companyName: "Data Analytics Pro",
    contactPerson: "Sarah Johnson",
    email: "sarah@dataanalytics.de",
    phone: "+49 444 789123",
    location: {
      city: "Frankfurt",
      postalCode: "60311",
      country: "Deutschland",
    },
    specializations: ["Data Science", "Machine Learning", "Analytics"],
    rating: 4.9,
    reviewCount: 31,
    status: "ACTIVE",
    joinedAt: "2022-08-20T14:00:00Z",
    lastActive: "2024-01-21T10:15:00Z",
    completedProjects: 25,
    responseTime: "1 Stunde",
    verified: true,
  },
  {
    id: "5",
    companyName: "Security Solutions",
    contactPerson: "Michael Bauer",
    email: "michael@securitysolutions.de",
    phone: "+49 333 456789",
    location: {
      city: "Köln",
      postalCode: "50667",
      country: "Deutschland",
    },
    specializations: ["Cybersecurity", "Network Security", "Compliance"],
    rating: 4.7,
    reviewCount: 19,
    status: "PENDING",
    joinedAt: "2024-01-10T08:00:00Z",
    lastActive: "2024-01-20T12:00:00Z",
    completedProjects: 3,
    responseTime: "6 Stunden",
    verified: false,
  },
];

const DienstleisterPage = () => {
  const router = useRouter();
  const t = useTranslations("Dashboard.serviceProviders");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ACTIVE" | "INACTIVE" | "PENDING"
  >("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const handleViewProfile = (provider: DienstleisterData) => {
    // Navigate to provider profile
    router.push(`/dashboard/dienstleister/${provider.id}`);
  };

  const handleView = (provider: DienstleisterData) => {
    // View provider details
    router.push(`/dashboard/dienstleister/${provider.id}`);
  };

  const handleContact = (provider: DienstleisterData) => {
    // Contact provider - implement your logic here
    console.log("Contacting provider:", provider.id);
    // Could open a modal, navigate to contact form, etc.
  };

  // Filter providers based on selected filters
  const filteredProviders = React.useMemo(() => {
    return mockServiceProviders.filter((provider) => {
      const matchesStatus =
        statusFilter === "all" || provider.status === statusFilter;
      const matchesLocation =
        locationFilter === "all" ||
        provider.location?.city
          .toLowerCase()
          .includes(locationFilter.toLowerCase());
      return matchesStatus && matchesLocation;
    });
  }, [statusFilter, locationFilter]);

  // Create provider columns with action handlers
  const columns = useDienstleisterColumns(
    handleView,
    handleContact,
    handleViewProfile
  );

  // Get unique locations for filter
  const locations = React.useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(
        mockServiceProviders
          .map((provider) => provider.location?.city)
          .filter(Boolean)
      )
    );
    return uniqueLocations;
  }, []);

  // Custom filters for the abgeschlossen design format
  const customFilters = (
    <>
      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "all" | "ACTIVE" | "INACTIVE" | "PENDING")
        }
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder={t("filters.selectStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
          <SelectItem value="ACTIVE">{t("filters.active")}</SelectItem>
          <SelectItem value="INACTIVE">{t("filters.inactive")}</SelectItem>
          <SelectItem value="PENDING">{t("filters.pending")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Location Filter */}
      <Select
        value={locationFilter}
        onValueChange={(value) => setLocationFilter(value)}
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder={t("filters.selectLocation")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allLocations")}</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location} value={location!}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <DataTable
        // Abgeschlossen design format props
        title={t("title")}
        description={t("description")}
        icon={<Users className="h-5 w-5 text-blue-600" />}
        customFilters={customFilters}
        cardLayout={true}
        // Data and functionality
        data={filteredProviders}
        columns={columns}
        loading={false}
        error={null}
        emptyMessage={t("emptyState")}
        enableSorting={true}
        enableSearch={true}
        enablePagination={true}
        pageSize={10}
      />
    </div>
  );
};

export default DienstleisterPage;
