"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  UserPlus,
  UserMinus,
  ChevronDown,
  FileText,
  Clock,
} from "lucide-react";

// Mock employee data type
type EmployeeDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  permission: string;
};

// Mock order data type
type Order = {
  id: string;
  orderName: string;
  date: string;
  location: string;
  category: string;
  status: "In Bearbeitung" | "Abgeschlossen" | "Ausstehend";
};

const mockEmployee: EmployeeDetails = {
  id: "1",
  name: "Erika Mustermann",
  email: "erika.mustermann@firma.de",
  phone: "0123 4567890",
  department: "Marketing",
  permission: "admin", // Default to admin to match image's visual
};

const mockOrders: Order[] = [
  {
    id: "order1",
    orderName: "Indusync Projekt A",
    date: "16.03.2025 18:32",
    location: "Berlin",
    category: "Microsoft Word Dokument",
    status: "In Bearbeitung",
  },
  {
    id: "order2",
    orderName: "Indusync Website Relaunch",
    date: "16.03.2025 18:32",
    location: "München",
    category: "Webentwicklung",
    status: "Abgeschlossen",
  },
  {
    id: "order3",
    orderName: "Indusync Marketing Kampagne",
    date: "16.03.2025 18:32",
    location: "Hamburg",
    category: "Marketing Plan",
    status: "Ausstehend",
  },
];

// Mock available orders for assignment modal
const mockAvailableOrders: Order[] = [
  {
    id: "order4",
    orderName: "Neues Dashboard Design",
    date: "30.08.2025",
    location: "Remote",
    category: "UI/UX Design",
    status: "Ausstehend",
  },
  {
    id: "order5",
    orderName: "API Entwicklung für Mobile App",
    date: "15.09.2025",
    location: "Remote",
    category: "Backend Entwicklung",
    status: "Ausstehend",
  },
  {
    id: "order6",
    orderName: "Cloud Migration Strategie",
    date: "01.10.2025",
    location: "Berlin",
    category: "Consulting",
    status: "Ausstehend",
  },
];

const getStatusBadgeClass = (status: Order["status"]) => {
  switch (status) {
    case "In Bearbeitung":
      return "bg-blue-100 text-blue-700";
    case "Abgeschlossen":
      return "bg-green-100 text-green-700";
    case "Ausstehend":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const EmployeeEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [permission, setPermission] = useState("");

  // Placeholder for selected orders in modal
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    if (employeeId === mockEmployee.id) {
      setName(mockEmployee.name);
      setEmail(mockEmployee.email);
      setPhone(mockEmployee.phone);
      setDepartment(mockEmployee.department);
      setPermission(mockEmployee.permission);
    } else {
      // router.push("/dashboard/mitarbeiter");
    }
  }, [employeeId, router]);

  const handleSaveChanges = () => {
    console.log("Saving changes:", {
      name,
      email,
      phone,
      department,
      permission,
    });
  };

  const handleAssignOrders = () => {
    console.log(
      `Assigning orders: ${selectedOrders.join(", ")} to employee ${employeeId}`
    );
    // Logic to assign orders, then close modal (if not using DialogClose)
    setSelectedOrders([]); // Reset selection
  };

  const handleRemoveFromOrder = () => {
    console.log(`Removing employee ${employeeId} from a selected order (TBD)`);
    // Add logic for removing employee from a specific order
  };

  const handleDeleteAccount = () => {
    console.log(`Deleting account for employee ${employeeId}`);
    // Add logic for deleting account
    // Potentially navigate away, e.g., router.push("/dashboard/mitarbeiter");
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6 mb-10">
        {/* Mitarbeiterinformationen */}
        <div className="lg:col-span-2 p-6 rounded-md border bg-white">
          <h2 className="text-lg font-semibold mb-6 text-gray-700">
            Mitarbeiterinformationen
          </h2>
          <div className="space-y-5">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-600"
              >
                Name des Mitarbeiter
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-600"
              >
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-gray-600"
              >
                Telefon
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="department"
                className="text-sm font-medium text-gray-600"
              >
                Abteilung des MA
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Berechtigungen & Aktionen */}
        <div className="p-6 rounded-md border bg-white">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Berechtigungen & Aktionen
          </h2>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="permissions"
                className="text-sm font-medium text-gray-600"
              >
                Rechte des Mitarbeiters
              </Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger id="permissions" className="mt-1 w-full">
                  <SelectValue placeholder="Rechte auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Benutzer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assign Order Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleSaveChanges}
                >
                  <UserPlus size={17} /> Aufträge zuweisen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Aufträge zuweisen</DialogTitle>
                  <DialogDescription>
                    Wählen Sie die Aufträge aus, die Sie diesem Mitarbeiter
                    zuweisen möchten.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {/* Replace with actual order selection UI */}
                  {mockAvailableOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{order.orderName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.category} - {order.location}
                        </p>
                      </div>
                      {/* Basic checkbox, replace with shadcn Checkbox for better styling */}
                      <input
                        type="checkbox"
                        value={order.id}
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders((prev) => [...prev, order.id]);
                          } else {
                            setSelectedOrders((prev) =>
                              prev.filter((id) => id !== order.id)
                            );
                          }
                        }}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </div>
                  ))}
                  {mockAvailableOrders.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Keine Aufträge zur Zuweisung verfügbar.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Abbrechen
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={handleAssignOrders}>
                    Zuweisen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Remove From Order Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <UserMinus size={17} /> Aus Auftrag entfernen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Wirklich aus Auftrag entfernen?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Sind Sie sicher, dass Sie diesen Mitarbeiter vom aktuell
                    ausgewählten Auftrag entfernen möchten? Diese Aktion kann
                    nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveFromOrder}>
                    Ja, entfernen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 size={17} /> Account entfernen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Account wirklich löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Der
                    Account dieses Mitarbeiters wird dauerhaft entfernt und alle
                    zugehörigen Daten gehen verloren.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Dauerhaft Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Aktuelle Aufträge des Mitarbeiters */}
      <div className="p-6 rounded-md border bg-white">
        <h2 className="text-lg font-semibold mb-6 text-gray-700">
          Aktuelle Aufträge des Mitarbeiters
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-100">
                <TableHead className="text-gray-600 whitespace-nowrap">
                  <div className="flex items-center">
                    Auftragsname <ChevronDown size={16} className="ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 whitespace-nowrap">
                  <div className="flex items-center">
                    Datum <ChevronDown size={16} className="ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 whitespace-nowrap">
                  <div className="flex items-center">
                    Standort <ChevronDown size={16} className="ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 whitespace-nowrap">
                  <div className="flex items-center">
                    Auftragskategorie <ChevronDown size={16} className="ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 whitespace-nowrap">
                  <div className="flex items-center">
                    Status <ChevronDown size={16} className="ml-1" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />{" "}
                      {order.orderName}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" /> {order.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">
                    {order.location}
                  </TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">
                    {order.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full font-semibold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeEditPage;
