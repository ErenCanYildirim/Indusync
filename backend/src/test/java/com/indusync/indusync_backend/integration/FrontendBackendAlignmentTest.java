package com.indusync.indusync_backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.indusync.indusync_backend.authentication.api.dto.RegisterUserRequest;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.company.api.dto.RegisterCompanyRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests to verify frontend-backend alignment.
 * <p>
 * These tests ensure that the backend APIs properly support all
 * the fields and validation requirements from the frontend
 * registration stepper components.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@SpringBootTest
@AutoConfigureWebMvc
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class FrontendBackendAlignmentTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("Should validate account setup step with email and password")
    void testAccountSetupStepValidation() throws Exception {
        // Test data matching frontend account-setup step
        var stepData = new StepValidationData();
        stepData.setEmail("test@example.com");
        stepData.setPassword("SecurePass123");
        stepData.setConfirmPassword("SecurePass123");

        var validationRequest = new StepValidationRequest();
        validationRequest.setStep("account-setup");
        validationRequest.setData(stepData);

        mockMvc.perform(post("/auth/validation/step")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validationRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.step").value("account-setup"));
    }

    @Test
    @DisplayName("Should validate profile details step for business account")
    void testProfileDetailsBusinessValidation() throws Exception {
        // Test data matching frontend profile-details step for business accounts
        var stepData = new StepValidationData();
        stepData.setAccountType("business");
        stepData.setCompanyName("Test GmbH");
        stepData.setCompanyType("GmbH");
        stepData.setTaxId("123456789");
        stepData.setAddress("Teststraße 123");
        stepData.setPostalCode("10115");
        stepData.setCity("Berlin");
        stepData.setPhone("+49 30 12345678");
        stepData.setWebsite("https://test-company.de");

        var validationRequest = new StepValidationRequest();
        validationRequest.setStep("profile-details");
        validationRequest.setData(stepData);

        mockMvc.perform(post("/auth/validation/step")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validationRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));
    }

    @Test
    @DisplayName("Should validate Auftragnehmer details step with all required fields")
    void testAuftragnehmberDetailsValidation() throws Exception {
        // Test data matching frontend Auftragnehmer details step
        var stepData = new StepValidationData();
        stepData.setCompanyDetailsName("Beispiel Bau GmbH");
        stepData.setCompanyAddress("Firmenstraße 456");
        stepData.setCompanyPostalCode("10117");
        stepData.setCompanyCity("Berlin");
        stepData.setWorkRadius("25km");
        stepData.setCountrySelection("germany");
        stepData.setContactPersonCount(3);
        stepData.setContactPersonName("Max Mustermann");
        stepData.setContactDepartment("Geschäftsführung");
        stepData.setContactPersonEmail("max@beispiel-bau.de");
        stepData.setContactPersonPhone("+49 30 98765432");
        stepData.setEmployeeCount(15);
        stepData.setSpecializations(List.of("Hochbau", "Tiefbau", "Sanierung"));
        stepData.setIndustries(List.of("Bauwesen", "Handwerk"));
        stepData.setOrderCategories(List.of("Neubau", "Renovierung", "Reparatur"));
        stepData.setCompanyDescription(
                "Wir sind ein erfahrenes Bauunternehmen mit über 20 Jahren Erfahrung im Hoch- und Tiefbau. Unser Team besteht aus qualifizierten Fachkräften, die höchste Qualitätsstandards erfüllen.");
        stepData.setCompanyVerificationFile("verification_doc_12345.pdf");
        stepData.setCompanyCertificatesFile("certificates_67890.pdf");

        var validationRequest = new StepValidationRequest();
        validationRequest.setStep("auftragnehmer-details");
        validationRequest.setData(stepData);

        mockMvc.perform(post("/auth/validation/step")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validationRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));
    }

    @Test
    @DisplayName("Should provide public data for specializations")
    void testSpecializationsEndpoint() throws Exception {
        mockMvc.perform(get("/public/specializations")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].category").exists())
                .andExpect(jsonPath("$[0].subcategories").exists());
    }

    @Test
    @DisplayName("Should provide public data for industries")
    void testIndustriesEndpoint() throws Exception {
        mockMvc.perform(get("/public/industries")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").exists());
    }

    @Test
    @DisplayName("Should provide public data for order categories")
    void testOrderCategoriesEndpoint() throws Exception {
        mockMvc.perform(get("/public/order-categories")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Should validate postal codes")
    void testPostalCodeValidation() throws Exception {
        mockMvc.perform(get("/public/geo/validate-postal-code/10115")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postalCode").value("10115"))
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.city").exists());
    }

    @Test
    @DisplayName("Should provide work radius suggestions")
    void testWorkRadiusSuggestions() throws Exception {
        mockMvc.perform(get("/public/geo/suggested-radius")
                .param("companyType", "Bauunternehmen")
                .param("specialization", "Hochbau")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].value").exists())
                .andExpect(jsonPath("$[0].label").exists());
    }

    @Test
    @DisplayName("Should support complete company registration with all frontend fields")
    void testCompleteCompanyRegistration() throws Exception {
        // Create a complete company registration request that matches all frontend
        // fields
        RegisterCompanyRequest request = RegisterCompanyRequest.builder()
                // Core company information
                .companyName("Frontend Test GmbH")
                .companyType("GmbH")
                .taxId("123456789")
                .registrationNumber("HRB 123456")

                // Primary address
                .street("Teststraße")
                .houseNumber("123")
                .postalCode("10115")
                .city("Berlin")
                .country("Deutschland")

                // Contact information
                .contactEmail("info@frontend-test.de")
                .contactPhone("+49 30 12345678")
                .website("https://frontend-test.de")

                // Business roles
                .isAuftraggeber(false)
                .isAuftragnehmer(true)

                // Auftragnehmer-specific fields
                .companyDetailsName("Frontend Test Bau GmbH")
                .companyAddress("Firmenstraße 456")
                .companyPostalCode("10117")
                .companyCity("Berlin")
                .workRadius("25km")
                .workRadiusKm(25)
                .countrySelection("germany")
                .contactPersonCount(5)
                .contactPersonName("Anna Schmidt")
                .contactDepartment("Projektleitung")
                .contactPersonEmail("anna@frontend-test.de")
                .contactPersonPhone("+49 30 98765432")
                .employeeCount(20)
                .specializations(List.of("Hochbau", "Sanierung", "Modernisierung"))
                .industries(List.of("Bauwesen", "Handwerk", "Immobilien"))
                .orderCategories(List.of("Neubau", "Renovierung", "Wartung"))
                .companyDescription(
                        "Ein innovatives Bauunternehmen, das sich auf nachhaltige und energieeffiziente Bauweise spezialisiert hat. Mit einem erfahrenen Team von 20 Mitarbeitern realisieren wir Projekte von der Planung bis zur Fertigstellung.")
                .companyVerificationFile("verification_frontend_test.pdf")
                .companyCertificatesFile("certificates_frontend_test.pdf")

                // Additional business details
                .description("Zusätzliche Unternehmensbeschreibung")
                .businessHours("Mo-Fr 8:00-18:00")
                .foundedYear(2010)
                .employeeCount(20)
                .annualRevenue(2500000L)
                .vatNumber("DE123456789")
                .certifications(List.of("ISO 9001", "ISO 14001"))
                .insuranceCoverage(true)
                .logoUrl("https://frontend-test.de/logo.png")
                .build();

        mockMvc.perform(post("/company/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.successful").value(true))
                .andExpect(jsonPath("$.companyId").exists());
    }

    @Test
    @DisplayName("Should check email availability")
    void testEmailAvailabilityCheck() throws Exception {
        mockMvc.perform(get("/auth/validation/email-available")
                .param("email", "new-user@example.com")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new-user@example.com"))
                .andExpect(jsonPath("$.available").exists());
    }

    // Helper classes matching frontend data structures

    private static class StepValidationRequest {
        private String step;
        private StepValidationData data;

        // Getters and setters
        public String getStep() {
            return step;
        }

        public void setStep(String step) {
            this.step = step;
        }

        public StepValidationData getData() {
            return data;
        }

        public void setData(StepValidationData data) {
            this.data = data;
        }
    }

    private static class StepValidationData {
        // Account setup fields
        private String email;
        private String password;
        private String confirmPassword;

        // Profile details fields
        private String accountType;
        private String firstName;
        private String lastName;
        private String companyName;
        private String companyType;
        private String taxId;
        private String address;
        private String postalCode;
        private String city;
        private String phone;
        private String website;

        // Auftragnehmer details fields
        private String companyDetailsName;
        private String companyAddress;
        private String companyPostalCode;
        private String companyCity;
        private String workRadius;
        private String countrySelection;
        private Integer contactPersonCount;
        private String contactPersonName;
        private String contactDepartment;
        private String contactPersonEmail;
        private String contactPersonPhone;
        private Integer employeeCount;
        private List<String> specializations;
        private List<String> industries;
        private List<String> orderCategories;
        private String companyDescription;
        private String companyVerificationFile;
        private String companyCertificatesFile;

        // Getters and setters (abbreviated for brevity)
        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getConfirmPassword() {
            return confirmPassword;
        }

        public void setConfirmPassword(String confirmPassword) {
            this.confirmPassword = confirmPassword;
        }

        public String getAccountType() {
            return accountType;
        }

        public void setAccountType(String accountType) {
            this.accountType = accountType;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getCompanyName() {
            return companyName;
        }

        public void setCompanyName(String companyName) {
            this.companyName = companyName;
        }

        public String getCompanyType() {
            return companyType;
        }

        public void setCompanyType(String companyType) {
            this.companyType = companyType;
        }

        public String getTaxId() {
            return taxId;
        }

        public void setTaxId(String taxId) {
            this.taxId = taxId;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getPostalCode() {
            return postalCode;
        }

        public void setPostalCode(String postalCode) {
            this.postalCode = postalCode;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getWebsite() {
            return website;
        }

        public void setWebsite(String website) {
            this.website = website;
        }

        public String getCompanyDetailsName() {
            return companyDetailsName;
        }

        public void setCompanyDetailsName(String companyDetailsName) {
            this.companyDetailsName = companyDetailsName;
        }

        public String getCompanyAddress() {
            return companyAddress;
        }

        public void setCompanyAddress(String companyAddress) {
            this.companyAddress = companyAddress;
        }

        public String getCompanyPostalCode() {
            return companyPostalCode;
        }

        public void setCompanyPostalCode(String companyPostalCode) {
            this.companyPostalCode = companyPostalCode;
        }

        public String getCompanyCity() {
            return companyCity;
        }

        public void setCompanyCity(String companyCity) {
            this.companyCity = companyCity;
        }

        public String getWorkRadius() {
            return workRadius;
        }

        public void setWorkRadius(String workRadius) {
            this.workRadius = workRadius;
        }

        public String getCountrySelection() {
            return countrySelection;
        }

        public void setCountrySelection(String countrySelection) {
            this.countrySelection = countrySelection;
        }

        public Integer getContactPersonCount() {
            return contactPersonCount;
        }

        public void setContactPersonCount(Integer contactPersonCount) {
            this.contactPersonCount = contactPersonCount;
        }

        public String getContactPersonName() {
            return contactPersonName;
        }

        public void setContactPersonName(String contactPersonName) {
            this.contactPersonName = contactPersonName;
        }

        public String getContactDepartment() {
            return contactDepartment;
        }

        public void setContactDepartment(String contactDepartment) {
            this.contactDepartment = contactDepartment;
        }

        public String getContactPersonEmail() {
            return contactPersonEmail;
        }

        public void setContactPersonEmail(String contactPersonEmail) {
            this.contactPersonEmail = contactPersonEmail;
        }

        public String getContactPersonPhone() {
            return contactPersonPhone;
        }

        public void setContactPersonPhone(String contactPersonPhone) {
            this.contactPersonPhone = contactPersonPhone;
        }

        public Integer getEmployeeCount() {
            return employeeCount;
        }

        public void setEmployeeCount(Integer employeeCount) {
            this.employeeCount = employeeCount;
        }

        public List<String> getSpecializations() {
            return specializations;
        }

        public void setSpecializations(List<String> specializations) {
            this.specializations = specializations;
        }

        public List<String> getIndustries() {
            return industries;
        }

        public void setIndustries(List<String> industries) {
            this.industries = industries;
        }

        public List<String> getOrderCategories() {
            return orderCategories;
        }

        public void setOrderCategories(List<String> orderCategories) {
            this.orderCategories = orderCategories;
        }

        public String getCompanyDescription() {
            return companyDescription;
        }

        public void setCompanyDescription(String companyDescription) {
            this.companyDescription = companyDescription;
        }

        public String getCompanyVerificationFile() {
            return companyVerificationFile;
        }

        public void setCompanyVerificationFile(String companyVerificationFile) {
            this.companyVerificationFile = companyVerificationFile;
        }

        public String getCompanyCertificatesFile() {
            return companyCertificatesFile;
        }

        public void setCompanyCertificatesFile(String companyCertificatesFile) {
            this.companyCertificatesFile = companyCertificatesFile;
        }
    }
}