"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MapPin, X } from "lucide-react";

export interface GeoapifyAddress {
  formatted: string;
  address_line1: string;
  address_line2: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
  country_code?: string;
  state?: string;
  lon: number;
  lat: number;
  place_id: string;
  bbox?: {
    lon1: number;
    lat1: number;
    lon2: number;
    lat2: number;
  };
}

export interface AddressAutocompleteProps {
  /** Current value of the address input */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the input field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Called when an address is selected */
  onAddressSelect?: (address: GeoapifyAddress) => void;
  /** Called when the input value changes */
  onInputChange?: (value: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Bias search results around a specific location */
  bias?: { lat: number; lon: number };
  /** Filter results to specific countries (ISO 3166-1 alpha-2) */
  countryFilter?: string[];
  /** Minimum number of characters to trigger search */
  minLength?: number;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Types of places to search for */
  types?: (
    | "country"
    | "state"
    | "city"
    | "postcode"
    | "street"
    | "amenity"
    | "locality"
  )[];
}

interface GeoapifyResponse {
  results: GeoapifyAddress[];
  query: {
    text: string;
    parsed?: any;
  };
}

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

export function AddressAutocomplete({
  value = "",
  placeholder = "Adresse eingeben...",
  label,
  required = false,
  onAddressSelect,
  onInputChange,
  className,
  error = false,
  errorMessage,
  bias,
  countryFilter = ["de", "at"], // Default to Germany and Austria
  minLength = 3,
  debounceDelay = 300,
  types = ["street"],
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoapifyAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Update input value when prop changes
  useEffect(() => {
    // Prevent error messages from being set as input value
    if (
      value &&
      (value.trim().startsWith("{") || value.includes("statusCode"))
    ) {
      console.warn("Prevented error message from being set as input value");
      setInputValue("");
      return;
    }
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!GEOAPIFY_API_KEY) {
        console.error("Geoapify API key is not configured");
        return;
      }

      // Validate query is a proper string and not an error message
      if (
        !query ||
        typeof query !== "string" ||
        query.trim().length < minLength
      ) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Additional safeguard: Don't process JSON-like strings
      if (
        query.trim().startsWith("{") ||
        query.includes("statusCode") ||
        query.includes('"error"')
      ) {
        console.warn(
          "Ignoring invalid query that looks like an error response"
        );
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          text: query,
          apiKey: GEOAPIFY_API_KEY,
          format: "json",
          limit: "5",
        });

        // Add country filter
        if (countryFilter.length > 0) {
          params.append("filter", `countrycode:${countryFilter.join(",")}`);
        }

        // Add bias if provided
        if (bias) {
          params.append("bias", `proximity:${bias.lon},${bias.lat}`);
        }

        // Add types filter
        if (types.length > 0) {
          params.append("type", types.join(","));
        }

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
          { signal: abortController.current.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GeoapifyResponse = await response.json();
        setSuggestions(data.results || []);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [GEOAPIFY_API_KEY, minLength, countryFilter, bias, types]
  );

  const debouncedFetchSuggestions = useCallback(
    (query: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(query);
      }, debounceDelay);
    },
    [fetchSuggestions, debounceDelay]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Prevent JSON error messages from being processed
    if (newValue.trim().startsWith("{") || newValue.includes("statusCode")) {
      console.warn(
        "Detected error message in input, ignoring:",
        newValue.substring(0, 100)
      );
      return;
    }

    setInputValue(newValue);
    onInputChange?.(newValue);
    debouncedFetchSuggestions(newValue);
  };

  const handleSuggestionSelect = (address: GeoapifyAddress) => {
    setInputValue(address.formatted);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onAddressSelect?.(address);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicking
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  const clearInput = () => {
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
    onInputChange?.("");
    inputRef.current?.focus();
  };

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  if (!GEOAPIFY_API_KEY) {
    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Geoapify API key is not configured. Please add
          NEXT_PUBLIC_GEOAPIFY_API_KEY to your environment variables.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {label && (
        <Label htmlFor="address-input" className="text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id="address-input"
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "pr-20",
            error ? "border-destructive" : "border-input",
            "bg-background text-foreground"
          )}
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          )}

          {inputValue && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              tabIndex={-1}
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}

          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {errorMessage && (
        <p className="text-destructive text-xs mt-1">{errorMessage}</p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.place_id || index}
                ref={(el) => {
                  suggestionRefs.current[index] = el;
                }}
                className={cn(
                  "px-4 py-2 cursor-pointer flex items-start space-x-3 hover:bg-gray-50",
                  highlightedIndex === index && "bg-blue-50"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.address_line1}
                  </div>
                  {suggestion.address_line2 && (
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.address_line2}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
