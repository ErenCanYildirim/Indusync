package com.indusync.indusync_backend.authentication.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


/**
 * Service for generating device fingerprints based on client information.
 * <p>
 * This service creates unique device identifiers using:
 * - User agent string analysis
 * - IP address (with privacy considerations)
 * - Additional client-provided fingerprint data
 * - Browser and OS detection
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
@Service
@Slf4j
public class DeviceFingerprintingService {

    private static final Pattern BROWSER_PATTERN = Pattern.compile(
            "(Chrome|Firefox|Safari|Edge|Opera|Internet Explorer)[\\/\\s]([\\d\\.]+)",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern OS_PATTERN = Pattern.compile(
            "(Windows NT [\\d\\.]+|Mac OS X [\\d_\\.]+|Linux|Android [\\d\\.]+|iOS [\\d_\\.]+)",
            Pattern.CASE_INSENSITIVE);

    /**
     * Generates a device fingerprint based on available client information.
     *
     * @param userAgent             the user agent string
     * @param ipAddress             the client IP address
     * @param additionalFingerprint additional fingerprint data from client
     * @return generated device fingerprint
     */
    public String generateDeviceFingerprint(String userAgent, String ipAddress, String additionalFingerprint) {
        StringBuilder fingerprintData = new StringBuilder();

        // add normalized user agent components
        if (userAgent != null && !userAgent.trim().isEmpty()) {
            fingerprintData.append(normalizeUserAgent(userAgent));
        }

        // add IP subnet
        if (ipAddress != null && !ipAddress.trim().isEmpty()) {
            fingerprintData.append("|").append(getIpSubnet(ipAddress));
        }

        // add additional fingerprint data
        if (additionalFingerprint != null && !additionalFingerprint.trim().isEmpty()) {
            fingerprintData.append("|").append(additionalFingerprint.trim());
        }

        // Generate SHA-256 hash of the fingerprint data
        return generateHash(fingerprintData.toString());
    }

     /**
     * Extracts browser information from user agent string.
     *
     * @param userAgent the user agent string
     * @return browser name and version, or "Unknown Browser" if not detected
     */
    public String extractBrowser(String userAgent) {
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return "Unknown Browser";
        }
        
        Matcher matcher = BROWSER_PATTERN.matcher(userAgent);
        if (matcher.find()) {
            return matcher.group(1) + " " + matcher.group(2);
        }
        
        return "Unknown Browser";
    }

    /**
     * Extracts operating system information from user agent string.
     *
     * @param userAgent the user agent string
     * @return operating system name and version, or "Unknown OS" if not detected
     */
    public String extractOperatingSystem(String userAgent) {
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return "Unknown OS";
        }
        
        Matcher matcher = OS_PATTERN.matcher(userAgent);
        if (matcher.find()) {
            String os = matcher.group(1);
            // Normalize OS names
            if (os.startsWith("Windows NT")) {
                return "Windows " + mapWindowsVersion(os);
            } else if (os.startsWith("Mac OS X")) {
                return "macOS " + os.substring(9).replace("_", ".");
            } else if (os.startsWith("Android")) {
                return os;
            } else if (os.startsWith("iOS")) {
                return os;
            } else {
                return os;
            }
        }
        
        return "Unknown OS";
    }

    /**
     * Determines device type based on user agent string.
     *
     * @param userAgent the user agent string
     * @return device type (Mobile, Tablet, Desktop, or Unknown)
     */
    public String extractDeviceType(String userAgent) {
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return "Unknown";
        }
        
        String lowerUserAgent = userAgent.toLowerCase();
        
        if (lowerUserAgent.contains("mobile") || 
            lowerUserAgent.contains("android") && !lowerUserAgent.contains("tablet") ||
            lowerUserAgent.contains("iphone") ||
            lowerUserAgent.contains("windows phone")) {
            return "Mobile";
        } else if (lowerUserAgent.contains("tablet") || 
                   lowerUserAgent.contains("ipad")) {
            return "Tablet";
        } else if (lowerUserAgent.contains("windows") || 
                   lowerUserAgent.contains("macintosh") || 
                   lowerUserAgent.contains("linux") ||
                   lowerUserAgent.contains("x11")) {
            return "Desktop";
        }
        
        return "Unknown";
    }

    /**
     * Validates if a device fingerprint is valid.
     *
     * @param fingerprint the device fingerprint to validate
     * @return true if the fingerprint is valid
     */
    public boolean isValidFingerprint(String fingerprint) {
        if (fingerprint == null || fingerprint.trim().isEmpty()) {
            return false;
        }
        
        // Check if it's a valid SHA-256 hash (64 hex characters)
        return fingerprint.matches("^[a-fA-F0-9]{64}$");
    }

    /**
     * Compares two device fingerprints for similarity.
     *
     * @param fingerprint1 the first fingerprint
     * @param fingerprint2 the second fingerprint
     * @return true if fingerprints are identical
     */
    public boolean areFingerprintsSimilar(String fingerprint1, String fingerprint2) {
        if (fingerprint1 == null || fingerprint2 == null) {
            return false;
        }
        
        return fingerprint1.equals(fingerprint2);
    }

    // === Private Helper Methods ===

    private String normalizeUserAgent(String userAgent) {
        // Remove version numbers and specific build information to create more stable fingerprints
        String normalized = userAgent.replaceAll("\\d+\\.\\d+\\.\\d+\\.\\d+", "X.X.X.X"); // Version numbers
        normalized = normalized.replaceAll("\\b\\d{4,}\\b", "XXXX"); // Build numbers
        
        return normalized.trim();
    }

    private String getIpSubnet(String ipAddress) {
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return "unknown";
        }
        
        // For IPv4, use first 3 octets for privacy
        if (ipAddress.contains(".")) {
            String[] parts = ipAddress.split("\\.");
            if (parts.length >= 3) {
                return parts[0] + "." + parts[1] + "." + parts[2] + ".0";
            }
        }
        
        // For IPv6, use first 4 groups for privacy
        if (ipAddress.contains(":")) {
            String[] parts = ipAddress.split(":");
            if (parts.length >= 4) {
                return parts[0] + ":" + parts[1] + ":" + parts[2] + ":" + parts[3] + "::";
            }
        }
        
        return "unknown";
    }

    private String generateHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            // Fallback to simple hash
            return String.valueOf(input.hashCode());
        }
    }

    private String mapWindowsVersion(String windowsNT) {
        // Map Windows NT versions to user-friendly names
        if (windowsNT.contains("10.0")) return "10";
        if (windowsNT.contains("6.3")) return "8.1";
        if (windowsNT.contains("6.2")) return "8";
        if (windowsNT.contains("6.1")) return "7";
        if (windowsNT.contains("6.0")) return "Vista";
        if (windowsNT.contains("5.1") || windowsNT.contains("5.2")) return "XP";
        
        return windowsNT.substring(11); // Return version number if not mapped
    }
}