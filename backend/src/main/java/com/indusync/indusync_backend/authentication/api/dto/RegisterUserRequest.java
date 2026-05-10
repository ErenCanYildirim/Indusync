package com.indusync.indusync_backend.authentication.api.dto;

import com.indusync.indusync_backend.shared.validation.PostalCode;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterUserRequest {

    @NotBlank(message = "E-Mail ist erforderlich")
    @Email(message = "E-Mail-Format ist ungültig")
    @Size(max = 255, message = "E-Mail darf maximal 255 Zeichen lang sein")
    private String email;

    @NotBlank(message = "Passwort ist erforderlich")
    @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$", message = "Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten")
    private String password;

    @NotBlank(message = "Passwort-Bestätigung ist erforderlich")
    private String confirmPassword;

    @NotBlank(message = "Kontotyp ist erforderlich")
    @Pattern(regexp = "PERSONAL|BUSINESS", message = "Kontotyp muss PERSONAL oder BUSINESS sein")
    private String accountType;

    @Size(max = 100, message = "Vorname darf maximal 100 Zeichen lang sein")
    private String firstName;

    @Size(max = 100, message = "Nachname darf maximal 100 Zeichen lang sein")
    private String lastName;

    @Size(max = 20, message = "Telefon darf maximal 20 Zeichen lang sein")
    private String phone;

    @Size(max = 255, message = "Website darf maximal 255 Zeichen lang sein")
    private String website;

    // Company-specific fields (for business accounts)
    @Size(max = 200, message = "Firmenname darf maximal 200 Zeichen lang sein")
    private String companyName;

    @Pattern(regexp = "EINZELUNTERNEHMEN|GBR|GMBH|AG|UG|OHG|KG|GMBH_CO_KG|OTHER", message = "Ungültiger Unternehmenstyp")
    private String companyType;

    @Size(max = 20, message = "Steuernummer darf maximal 20 Zeichen lang sein")
    private String taxId;

    @Size(max = 50, message = "Handelsregisternummer darf maximal 50 Zeichen lang sein")
    private String registrationNumber;

    // Address fields
    @Size(max = 100, message = "Straße darf maximal 100 Zeichen lang sein")
    private String street;

    @Size(max = 10, message = "Hausnummer darf maximal 10 Zeichen lang sein")
    private String houseNumber;

    @PostalCode
    private String postalCode;

    @Size(max = 100, message = "Stadt darf maximal 100 Zeichen lang sein")
    private String city;

    @Size(max = 50, message = "Land darf maximal 50 Zeichen lang sein")
    private String country;

    // Location coordinates
    private Double latitude;
    private Double longitude;

    // Business-specific fields
    private Integer workRadiusKm;

    private List<String> specializations;

    private List<String> industries;

    private List<String> orderCategories;

    private String description;

    // Role flags
    private Boolean companyTypeAuftraggeber;
    private Boolean companyTypeAuftragnehmer;

    // === Auftragnehmer-specific fields (from frontend registration stepper) ===

    // Company details name (separate from user company name)
    @Size(max = 200, message = "Unternehmensname darf maximal 200 Zeichen lang sein")
    private String companyDetailsName;

    // Company headquarters address (separate from user address)
    @Size(max = 100, message = "Firmenadresse darf maximal 100 Zeichen lang sein")
    private String companyAddress;

    @PostalCode(message = "Firmen-PLZ muss genau 5 Ziffern haben (z.B. 12345). Bitte geben Sie nur Zahlen ein.")
    private String companyPostalCode;

    @Size(max = 100, message = "Firmenstadt darf maximal 100 Zeichen lang sein")
    private String companyCity;

    // Work radius and country selection
    @Size(max = 20, message = "Arbeitsradius darf maximal 20 Zeichen lang sein")
    private String workRadius;

    @Size(max = 100, message = "Länderauswahl darf maximal 100 Zeichen lang sein")
    private String countrySelection;

    // Contact person information
    private Integer contactPersonCount;

    @Size(max = 200, message = "Kontaktpersonenname darf maximal 200 Zeichen lang sein")
    private String contactPersonName;

    @Size(max = 100, message = "Kontaktabteilung darf maximal 100 Zeichen lang sein")
    private String contactDepartment;

    @Email(message = "Kontakt-E-Mail-Format ist ungültig")
    @Size(max = 255, message = "Kontakt-E-Mail darf maximal 255 Zeichen lang sein")
    private String contactEmail;

    @Size(max = 20, message = "Kontakttelefon darf maximal 20 Zeichen lang sein")
    private String contactPhone;

    // Employee count
    private Integer employeeCount;

    // Company description (for Auftragnehmer)
    @Size(max = 600, message = "Unternehmensbeschreibung darf maximal 600 Zeichen lang sein")
    private String companyDescription;

    // User preferences
    private Boolean emailNotifications;

    private List<String> interests;

    @Size(max = 100, message = "Empfehlungsquelle darf maximal 100 Zeichen lang sein")
    private String referralSource;

    // Terms and privacy
    @AssertTrue(message = "Allgemeine Geschäftsbedingungen müssen akzeptiert werden")
    private Boolean termsAccepted;

    @AssertTrue(message = "Datenschutzerklärung muss akzeptiert werden")
    private Boolean privacyAccepted;

    // Custom validation method
    public boolean isPasswordConfirmed() {
        return password != null && password.equals(confirmPassword);
    }

    public boolean isBusinessAccount() {
        return "BUSINESS".equals(accountType);
    }

    public boolean isPersonalAccount() {
        return "PERSONAL".equals(accountType);
    }

    public boolean isAuftragnehmer() {
        return Boolean.TRUE.equals(companyTypeAuftragnehmer);
    }

    public boolean isAuftraggeber() {
        return Boolean.TRUE.equals(companyTypeAuftraggeber);
    }

    public boolean isBothRoles() {
        return isAuftragnehmer() && isAuftraggeber();
    }
}