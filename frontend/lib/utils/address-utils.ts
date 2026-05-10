import { GeoapifyAddress } from "@/components/ui/address-autocomplete";

/**
 * Utility functions for handling address data from Geoapify
 */

export interface ParsedAddress {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
}

/**
 * Parse a Geoapify address response into form fields
 */
export function parseGeoapifyAddress(address: GeoapifyAddress): ParsedAddress {
    // Handle case where address might be incomplete or missing fields
    if (!address || typeof address !== 'object') {
        console.warn('Invalid address object received:', address);
        return {
            street: '',
            houseNumber: '',
            postalCode: '',
            city: '',
            country: 'Deutschland',
            latitude: 0,
            longitude: 0,
            formattedAddress: '',
        };
    }

    // Extract street and house number safely
    const street = address.street || extractStreetFromAddressLine(address.address_line1 || '');
    const houseNumber = address.housenumber || extractHouseNumberFromAddressLine(address.address_line1 || '');

    const result = {
        street: street || '',
        houseNumber: houseNumber || '0', // Provide default value for backend validation
        postalCode: address.postcode || '',
        city: address.city || '',
        country: address.country || 'Deutschland',
        latitude: address.lat || 0,
        longitude: address.lon || 0,
        formattedAddress: address.formatted || '',
    };

    // Log for debugging
    if (!houseNumber) {
        console.log('🏠 No house number found in address, using default "0":', {
            original: address,
            parsed: result
        });
    }

    return result;
}

/**
 * Extract street name from address line (fallback when street field is not available)
 */
function extractStreetFromAddressLine(addressLine: string): string {
    if (!addressLine) return '';

    // Remove house number from the end
    const parts = addressLine.trim().split(/\s+/);
    const lastPart = parts[parts.length - 1];

    // If last part looks like a house number, remove it
    if (/^\d+[a-zA-Z]?$/.test(lastPart) || /^\d+[-/]\d+[a-zA-Z]?$/.test(lastPart)) {
        return parts.slice(0, -1).join(' ');
    }

    return addressLine;
}

/**
 * Extract house number from address line (fallback when housenumber field is not available)
 */
function extractHouseNumberFromAddressLine(addressLine: string): string {
    if (!addressLine) return '';

    const parts = addressLine.trim().split(/\s+/);
    const lastPart = parts[parts.length - 1];

    // Check if last part looks like a house number
    if (/^\d+[a-zA-Z]?$/.test(lastPart) || /^\d+[-/]\d+[a-zA-Z]?$/.test(lastPart)) {
        return lastPart;
    }

    // Look for house number pattern anywhere in the string
    const houseNumberMatch = addressLine.match(/\b(\d+[a-zA-Z]?|\d+[-/]\d+[a-zA-Z]?)\b/);
    return houseNumberMatch ? houseNumberMatch[1] : '';
}

/**
 * Validate if coordinates are reasonable for Germany/Austria
 */
export function validateCoordinates(lat: number, lon: number): boolean {
    // Rough bounds for Germany and Austria
    const minLat = 47.0; // Southern Austria
    const maxLat = 55.1; // Northern Germany
    const minLon = 5.9;  // Western Germany
    const maxLon = 17.2; // Eastern Austria

    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Create a combined address string for API submission
 */
export function createFullAddress(parsed: Partial<ParsedAddress>): string {
    const parts = [
        parsed.street && parsed.houseNumber ? `${parsed.street} ${parsed.houseNumber}` : (parsed.street || ''),
        parsed.postalCode && parsed.city ? `${parsed.postalCode} ${parsed.city}` : (parsed.city || ''),
        parsed.country || 'Deutschland'
    ].filter(Boolean);

    return parts.join(', ');
}

/**
 * Get bias coordinates for major German cities
 */
export function getCityBias(cityName: string): { lat: number; lon: number } | null {
    const cityCoordinates: Record<string, { lat: number; lon: number }> = {
        'berlin': { lat: 52.5200, lon: 13.4050 },
        'hamburg': { lat: 53.5511, lon: 9.9937 },
        'münchen': { lat: 48.1351, lon: 11.5820 },
        'munich': { lat: 48.1351, lon: 11.5820 },
        'köln': { lat: 50.9375, lon: 6.9603 },
        'cologne': { lat: 50.9375, lon: 6.9603 },
        'frankfurt': { lat: 50.1109, lon: 8.6821 },
        'stuttgart': { lat: 48.7758, lon: 9.1829 },
        'düsseldorf': { lat: 51.2277, lon: 6.7735 },
        'dortmund': { lat: 51.5136, lon: 7.4653 },
        'essen': { lat: 51.4556, lon: 7.0116 },
        'leipzig': { lat: 51.3397, lon: 12.3731 },
        'bremen': { lat: 53.0793, lon: 8.8017 },
        'dresden': { lat: 51.0504, lon: 13.7373 },
        'hannover': { lat: 52.3759, lon: 9.7320 },
        'nürnberg': { lat: 49.4521, lon: 11.0767 },
        'nuremberg': { lat: 49.4521, lon: 11.0767 },
        // Austrian cities
        'wien': { lat: 48.2082, lon: 16.3738 },
        'vienna': { lat: 48.2082, lon: 16.3738 },
        'graz': { lat: 47.0707, lon: 15.4395 },
        'linz': { lat: 48.3069, lon: 14.2858 },
        'salzburg': { lat: 47.8095, lon: 13.0550 },
        'innsbruck': { lat: 47.2692, lon: 11.4041 },
    };

    const normalizedCity = cityName.toLowerCase().trim();
    return cityCoordinates[normalizedCity] || null;
} 