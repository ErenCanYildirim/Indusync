"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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

const permissionsOptions = [
  { value: "", label: "Bitte auswählen" },
  { value: "read", label: "Lesen" },
  { value: "write", label: "Schreiben" },
  { value: "admin", label: "Admin" },
];

const durationOptions = [
  { value: "Unbegrenzt", label: "Unbegrenzt" },
  { value: "1m", label: "1 Monat" },
  { value: "3m", label: "3 Monate" },
  { value: "6m", label: "6 Monate" },
];

const NewEmployeePage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [permission, setPermission] = useState("");
  const [duration, setDuration] = useState("Unbegrenzt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !department || !permission || !duration) {
      setError("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      setDepartment("");
      setPermission("");
      setDuration("Unbegrenzt");
    }, 1200);
  };

  const handleCancel = () => {
    router.push("/dashboard/mitarbeiter");
  };

  return (
    <div className="min-h-screen flex justify-center mt-16 md:mt-24">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl flex flex-col gap-6"
        aria-label="Neuen Mitarbeiter anlegen"
      >
        <div>
          <h1 className="text-xl font-bold mb-1">Neuen Mitarbeiter anlegen</h1>
          <p className="text-muted-foreground text-sm">
            Füllen Sie die folgenden Informationen aus
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-Mail Adresse*</Label>
            <Input
              id="email"
              type="email"
              placeholder="max.mustermann@firma.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="department">Abteilung des Mitarbeiters*</Label>
            <Input
              id="department"
              type="text"
              placeholder="z.B. Marketing"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              aria-required="true"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="permission">Berechtigungen des Mitarbeiters*</Label>
            <Select value={permission} onValueChange={setPermission} required>
              <SelectTrigger
                id="permission"
                aria-label="Berechtigungen auswählen"
              >
                <SelectValue placeholder="Bitte auswählen" />
              </SelectTrigger>
              <SelectContent>
                {permissionsOptions
                  .filter((opt) => opt.value)
                  .map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="duration">Laufzeit des aktiven Accounts*</Label>
            <Select value={duration} onValueChange={setDuration} required>
              <SelectTrigger id="duration" aria-label="Laufzeit auswählen">
                <SelectValue placeholder="Unbegrenzt" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <div className="text-destructive text-sm">{error}</div>}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          aria-label="Mitarbeiter erstellen"
        >
          {loading ? "Erstellen..." : "Mitarbeiter erstellen"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={handleCancel}
          aria-label="Abbrechen"
        >
          Abbrechen
        </Button>
        <div className="text-xs text-muted-foreground mt-2">* Pflichtfeld</div>
      </form>
    </div>
  );
};

export default NewEmployeePage;
