"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Search, Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { setServers } from "dns";
import { isPast } from "date-fns";

type Invoice = {
  id: number;
  invoiceNumber: string;
  orderName: string;
  location: string;
  invoiceDate: string;
  billingPeriod: string;
}

const invoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: "RG-2024-001",
    orderName: "Büroumbau Hauptstraße",
    location: "Berlin",
    invoiceDate: "2024-01-15",
    billingPeriod: "Januar 2024",
  },
  {
    id: 2,
    invoiceNumber: "RG-2024-002",
    orderName: "Renovierung Lagerhaus",
    location: "München",
    invoiceDate: "2024-01-20",
    billingPeriod: "Januar 2024",
  },
  {
    id: 3,
    invoiceNumber: "RG-2024-003",
    orderName: "Neubau Werkstatt",
    location: "Hamburg",
    invoiceDate: "2024-02-05",
    billingPeriod: "Februar 2024",
  },
  {
    id: 4,
    invoiceNumber: "RG-2024-004",
    orderName: "Modernisierung Bürokomplex",
    location: "Berlin",
    invoiceDate: "2024-02-10",
    billingPeriod: "Februar 2024",
  },
  {
    id: 5,
    invoiceNumber: "RG-2024-005",
    orderName: "Sanierung Industriehalle",
    location: "Frankfurt",
    invoiceDate: "2024-03-01",
    billingPeriod: "März 2024",
  },
  {
    id: 6,
    invoiceNumber: "RG-2024-006",
    orderName: "Ausbau Produktionsbereich",
    location: "München",
    invoiceDate: "2024-03-15",
    billingPeriod: "März 2024",
  },
];

//Filter options from data
const getLocationOptions = () => {
  const uniqueLocations = [...new Set(invoices.map(inv => inv.location))];
  return [
    {value: "all", label: "Alle Standorte"},
    ...uniqueLocations.map(location=>({value: location, label: location}))
  ];
};

const getInvoiceDateOptions = () => {
  const uniqueDates = [...new Set(invoices.map(inv => {
    const date = new Date(inv.invoiceDate);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
  }))];

  const monthNames = {
    '01': 'Januar', '02': 'Februar', '03': 'März', '04': 'April',
    '05': 'Mai', '06': 'Juni', '07': 'Juli', '08': 'August',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Dezember'
  };

  type MonthKey = keyof typeof monthNames;

  return [
    { value: "all", label: "Alle Daten" },
    ...uniqueDates.map(date => {
      const [year, month] = date.split('-');
      return {
        value: date,
        label: `${monthNames[month as MonthKey]}`
      };
    })
  ];
}

const getBillingPeriodOptions = () => {
  const uniquePeriods = [...new Set(invoices.map(inv=>inv.billingPeriod))];
  return [
    {value:"all", label: "Alle Zeiträume"},
    ...uniquePeriods.map(period=>({value:period, label:period}))
  ];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: `numeric`
  });
};

const RechnungenPage = () => {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [invoiceDate, setInvoiceDate] = useState("all");
  const [billingPeriod, setBillingPeriod] = useState("all");
  const router = useRouter();

  const handleSearchChange = (e:React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);
  const handleLocationChange = (v: string) => setLocation(v);
  const handleInvoiceDateChange = (v: string) => setInvoiceDate(v);
  const handleBillingPeriodChange = (v: string) => setBillingPeriod(v);

  const handleNewInvoiceClick = () => {
    router.push("/dashboard/rechnungen/new");
  };

  const handleViewClick = (id: number) => {
    router.push(`/dashboard/rechnungen/${id}`);
  };

  const handleEditClick = (id: number) => {
    router.push(`/dashboard/rechnunge/${id}/edit`);
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderName.toLowerCase().includes(search.toLowerCase());

      const matchesLocation = location === "all" ? true: inv.location === location;

      const matchesInvoiceDate = invoiceDate === "all" ? true:
        inv.invoiceDate.startsWith(invoiceDate);

      const matchesBillingPeriod = billingPeriod === "all" ? true:
        inv.billingPeriod === billingPeriod;

      return matchesSearch && matchesLocation && matchesInvoiceDate && matchesBillingPeriod;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Rechnungen</h1>
      <p className="text-muted-foreground mb-6">
        Verwalten Sie hier Ihre Rechnungen und behalten Sie den Überblick über alle Abrechnungen.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Input
              type="text"
              placeholder="Rechnung/Auftrag durchsuchen..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
              aria-label="Rechnung oder Auftrag durchsuchen"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          <Select value = {location} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Alle Standorte" />
            </SelectTrigger>
            <SelectContent>
              {getLocationOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={invoiceDate} onValueChange={handleInvoiceDateChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Alle Daten" />
            </SelectTrigger>
            <SelectContent>
              {getInvoiceDateOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} 
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={billingPeriod} onValueChange={handleBillingPeriodChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Alle Zeiträume" />
            </SelectTrigger>
            <SelectContent>
              {getBillingPeriodOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rechnungsnummer</TableHead>
              <TableHead>Auftragsname</TableHead>
              <TableHead>Standort</TableHead>
              <TableHead>Rechnungsdatum</TableHead>
              <TableHead>Rechnungszeitraum</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (              
              <TableRow>
                <TableCell 
                  colSpan={6}
                  className = "text-center py-8 text-muted-foreground"
                >
                  Keine Rechnungen gefunden 
                </TableCell>
              </TableRow>
            ): (
              filteredInvoices.map((inv) => (
                <TableRow key = {inv.id}>
                  <TableCell>
                    <span className="font-medium">{inv.invoiceNumber}</span>
                  </TableCell>
                  <TableCell>{inv.orderName}</TableCell>
                  <TableCell>{inv.location}</TableCell>
                  <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell>{inv.billingPeriod}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button
                      variant = "ghost"
                      size = "icon"
                      tabIndex = {0}
                      aria-label = {`Rechnung ${inv.invoiceNumber} ansehen`}
                      onClick = {() => handleViewClick(inv.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant = "ghost"
                      size="icon"
                      tabIndex={0}
                      aria-label={`Rechnung ${inv.invoiceNumber} bearbeiten`}
                      onClick={() => handleEditClick(inv.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RechnungenPage;