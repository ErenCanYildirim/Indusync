"use client";

import React, { useState } from "react";
import {
  AddressAutocomplete,
  GeoapifyAddress,
} from "@/components/ui/address-autocomplete";
import {
  parseGeoapifyAddress,
  formatCoordinates,
} from "@/lib/utils/address-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export function AddressDemo() {
  const [selectedAddress, setSelectedAddress] =
    useState<GeoapifyAddress | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleAddressSelect = (address: GeoapifyAddress) => {
    setSelectedAddress(address);
    const parsed = parseGeoapifyAddress(address);
    setParsedData(parsed);
    console.log("Selected address:", address);
    console.log("Parsed data:", parsed);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geoapify Address Autocomplete Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Start typing a German or Austrian address to see the autocomplete
              in action.
            </p>
            <AddressAutocomplete
              label="Adresse eingeben"
              placeholder="z.B. Brandenburger Tor, Berlin oder Salzburg Altstadt..."
              onAddressSelect={handleAddressSelect}
              className="max-w-md"
            />
          </div>

          {selectedAddress && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Raw Geoapify Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <strong>Formatted:</strong> {selectedAddress.formatted}
                  </div>
                  <div className="text-sm">
                    <strong>Address Line 1:</strong>{" "}
                    {selectedAddress.address_line1}
                  </div>
                  <div className="text-sm">
                    <strong>Address Line 2:</strong>{" "}
                    {selectedAddress.address_line2}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      Lat: {selectedAddress.lat.toFixed(6)}
                    </Badge>
                    <Badge variant="secondary">
                      Lng: {selectedAddress.lon.toFixed(6)}
                    </Badge>
                  </div>
                  {selectedAddress.street && (
                    <div className="text-sm">
                      <strong>Street:</strong> {selectedAddress.street}
                    </div>
                  )}
                  {selectedAddress.housenumber && (
                    <div className="text-sm">
                      <strong>House Number:</strong>{" "}
                      {selectedAddress.housenumber}
                    </div>
                  )}
                  {selectedAddress.postcode && (
                    <div className="text-sm">
                      <strong>Postcode:</strong> {selectedAddress.postcode}
                    </div>
                  )}
                  {selectedAddress.city && (
                    <div className="text-sm">
                      <strong>City:</strong> {selectedAddress.city}
                    </div>
                  )}
                  {selectedAddress.country && (
                    <div className="text-sm">
                      <strong>Country:</strong> {selectedAddress.country}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parsed Form Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parsedData && (
                    <>
                      <div className="text-sm">
                        <strong>Street:</strong> {parsedData.street || "N/A"}
                      </div>
                      <div className="text-sm">
                        <strong>House Number:</strong>{" "}
                        {parsedData.houseNumber || "N/A"}
                      </div>
                      <div className="text-sm">
                        <strong>Postal Code:</strong>{" "}
                        {parsedData.postalCode || "N/A"}
                      </div>
                      <div className="text-sm">
                        <strong>City:</strong> {parsedData.city || "N/A"}
                      </div>
                      <div className="text-sm">
                        <strong>Country:</strong> {parsedData.country || "N/A"}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">
                          📍{" "}
                          {formatCoordinates(
                            parsedData.latitude,
                            parsedData.longitude
                          )}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <strong>Full Address:</strong>{" "}
                        {parsedData.formattedAddress}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedAddress && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-6">
                <p className="text-muted-foreground">
                  Select an address to see the parsed data
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
            {`<AddressAutocomplete
  label="Adresse*"
  placeholder="Straße und Hausnummer eingeben..."
  onAddressSelect={(address) => {
    const parsed = parseGeoapifyAddress(address);
    setFormData(prev => ({
      ...prev,
      street: parsed.street,
      houseNumber: parsed.houseNumber,
      postalCode: parsed.postalCode,
      city: parsed.city,
      country: parsed.country,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    }));
  }}
  error={hasError}
  errorMessage="Please enter a valid address"
/>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}