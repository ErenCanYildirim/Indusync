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
import { PermissionGuard } from "@/components/PermissionGuard";
import { Users, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

// Import DataTable and employee columns
import { DataTable } from "@/components/ui/data-table";
import {
  useEmployeeColumns,
  Employee,
} from "@/components/tables/employee-columns";

const employees: Employee[] = [
  {
    id: "1",
    firstName: "Thomas",
    lastName: "Weber",
    email: "thomas.weber@example.com",
    role: "Admin",
    status: "ACTIVE",
    joinedAt: "2023-01-15T10:00:00Z",
    lastActive: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Schmidt",
    email: "marie.schmidt@example.com",
    role: "Mitarbeiter",
    status: "ACTIVE",
    joinedAt: "2023-03-10T09:00:00Z",
    lastActive: "2024-01-19T16:45:00Z",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Bauer",
    email: "michael.bauer@example.com",
    role: "Manager",
    status: "INACTIVE",
    joinedAt: "2022-11-05T11:30:00Z",
    lastActive: "2023-12-15T13:20:00Z",
  },
];

// Helper functions for permission checks
const canEditEmployee = (employee: Employee) => {
  // Add your permission logic here
  return true; // For now, allow all edits
};

const canDeactivateEmployee = (employee: Employee) => {
  // Add your permission logic here
  return employee.status === "ACTIVE"; // Only allow deactivating active employees
};

const EmployeePage = () => {
  const router = useRouter();
  const t = useTranslations("Dashboard.employees");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ACTIVE" | "INACTIVE"
  >("all");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "Admin" | "Manager" | "Mitarbeiter"
  >("all");

  const handleNewEmployeeClick = () => {
    // Navigate to new employee form
    router.push("/dashboard/mitarbeiter/new");
  };

  const handleViewClick = (employee: Employee) => {
    // View employee details
    router.push(`/dashboard/mitarbeiter/${employee.id}`);
  };

  const handleEditClick = (employee: Employee) => {
    // Edit employee
    router.push(`/dashboard/mitarbeiter/${employee.id}/edit`);
  };

  const handleDeactivateClick = (employee: Employee) => {
    // Deactivate employee - implement your logic here
    console.log("Deactivating employee:", employee.id);
  };

  // Filter employees based on selected filters
  const filteredEmployees = React.useMemo(() => {
    return employees.filter((employee) => {
      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;
      const matchesRole = roleFilter === "all" || employee.role === roleFilter;
      return matchesStatus && matchesRole;
    });
  }, [statusFilter, roleFilter]);

  // Create employee columns with action handlers
  const columns = useEmployeeColumns(
    handleViewClick,
    handleEditClick,
    handleDeactivateClick,
    canEditEmployee,
    canDeactivateEmployee
  );

  // Custom filters for the abgeschlossen design format
  const customFilters = (
    <>
      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "all" | "ACTIVE" | "INACTIVE")
        }
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder="Status auswählen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          <SelectItem value="ACTIVE">Aktiv</SelectItem>
          <SelectItem value="INACTIVE">Inaktiv</SelectItem>
        </SelectContent>
      </Select>

      {/* Role Filter */}
      <Select
        value={roleFilter}
        onValueChange={(value) =>
          setRoleFilter(value as "all" | "Admin" | "Manager" | "Mitarbeiter")
        }
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder="Rolle auswählen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Rollen</SelectItem>
          <SelectItem value="Admin">Admin</SelectItem>
          <SelectItem value="Manager">Manager</SelectItem>
          <SelectItem value="Mitarbeiter">Mitarbeiter</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <PermissionGuard
        permission="MANAGE_EMPLOYEES"
        fallback={
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Sie haben keine Berechtigung zur Mitarbeiterverwaltung.
            </p>
          </div>
        }
      >
        {/* Action Button - positioned above the DataTable */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleNewEmployeeClick}
            className="whitespace-nowrap"
            aria-label="Neuer Mitarbeiter"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Neuer Mitarbeiter
          </Button>
        </div>

        <DataTable
          // Abgeschlossen design format props
          title="Mitarbeiter"
          description="Verwalten Sie Ihre Mitarbeiter und sehen Sie den Status der Berechtigungen."
          icon={<Users className="h-5 w-5 text-blue-600" />}
          customFilters={customFilters}
          cardLayout={true}
          // Data and functionality
          data={filteredEmployees}
          columns={columns}
          loading={false}
          error={null}
          emptyMessage="Keine Mitarbeiter gefunden."
          enableSorting={true}
          enableSearch={true}
          enablePagination={true}
          pageSize={10}
        />
      </PermissionGuard>
    </div>
  );
};

export default EmployeePage;
