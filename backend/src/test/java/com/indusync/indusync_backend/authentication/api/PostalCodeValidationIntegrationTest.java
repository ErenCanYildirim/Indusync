// package com.indusync.indusync_backend.authentication.api;

// import com.fasterxml.jackson.databind.ObjectMapper;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureTestDatabase;
// import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
// import org.springframework.boot.test.mock.mockito.MockBean;
// import org.springframework.http.MediaType;
// import org.springframework.test.web.servlet.MockMvc;
// import org.springframework.test.web.servlet.MvcResult;

// import com.indusync.indusync_backend.authentication.application.AuthenticationApplicationService;
// import com.indusync.indusync_backend.shared.infrastructure.FileUploadService;

// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
// import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
// import static org.hamcrest.Matchers.*;

// /**
//  * Integration test for postal code validation in the registration endpoint.
//  * Tests the complete validation flow from controller to custom validator.
//  */
// @WebMvcTest(AuthenticationController.class)
// @AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
// class PostalCodeValidationIntegrationTest {

//     @Autowired
//     private MockMvc mockMvc;

//     @Autowired
//     private ObjectMapper objectMapper;

//     @MockBean
//     private AuthenticationApplicationService authService;

//     @MockBean
//     private FileUploadService fileUploadService;

//     @Test
//     void testValidPostalCodeValidation() throws Exception {
//         mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "test@example.com")
//                 .param("password", "Password123")
//                 .param("confirmPassword", "Password123")
//                 .param("accountType", "BUSINESS")
//                 .param("postalCode", "12345")
//                 .param("companyPostalCode", "67890")
//                 .param("termsAccepted", "true")
//                 .param("privacyAccepted", "true")
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isCreated());
//     }

//     @Test
//     void testInvalidPostalCode_TooShort() throws Exception {
//         MvcResult result = mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "test@example.com")
//                 .param("password", "Password123")
//                 .param("confirmPassword", "Password123")
//                 .param("accountType", "BUSINESS")
//                 .param("postalCode", "1234")  // Too short
//                 .param("termsAccepted", "true")
//                 .param("privacyAccepted", "true")
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isBadRequest())
//                 .andExpect(jsonPath("$.status", is(400)))
//                 .andExpect(jsonPath("$.message", containsString("Validierung fehlgeschlagen")))
//                 .andExpect(jsonPath("$.errors.postalCode", containsString("PLZ muss genau 5 Zeichen haben")))
//                 .andExpect(jsonPath("$.fieldTypes.postalCode", is("postal_code")))
//                 .andReturn();

//         String responseContent = result.getResponse().getContentAsString();
//         System.out.println("Response for too short postal code: " + responseContent);
//     }

//     @Test
//     void testInvalidCompanyPostalCode_NonNumeric() throws Exception {
//         MvcResult result = mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "test@example.com")
//                 .param("password", "Password123")
//                 .param("confirmPassword", "Password123")
//                 .param("accountType", "BUSINESS")
//                 .param("companyPostalCode", "dasf")  // Non-numeric (the original error case)
//                 .param("termsAccepted", "true")
//                 .param("privacyAccepted", "true")
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isBadRequest())
//                 .andExpect(jsonPath("$.status", is(400)))
//                 .andExpect(jsonPath("$.message", containsString("Validierung fehlgeschlagen")))
//                 .andExpect(jsonPath("$.errors.companyPostalCode", containsString("PLZ muss genau 5 Zeichen haben")))
//                 .andExpect(jsonPath("$.fieldTypes.companyPostalCode", is("postal_code")))
//                 .andReturn();

//         String responseContent = result.getResponse().getContentAsString();
//         System.out.println("Response for non-numeric company postal code: " + responseContent);
//     }

//     @Test
//     void testInvalidPostalCode_ContainsLetters() throws Exception {
//         mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "test@example.com")
//                 .param("password", "Password123")
//                 .param("confirmPassword", "Password123")
//                 .param("accountType", "BUSINESS")
//                 .param("postalCode", "1234a")  // Contains letter
//                 .param("termsAccepted", "true")
//                 .param("privacyAccepted", "true")
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isBadRequest())
//                 .andExpect(jsonPath("$.errors.postalCode", containsString("PLZ darf nur Zahlen enthalten")))
//                 .andExpect(jsonPath("$.fieldTypes.postalCode", is("postal_code")));
//     }

//     @Test
//     void testInvalidPostalCode_TooLong() throws Exception {
//         mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "test@example.com")
//                 .param("password", "Password123")
//                 .param("confirmPassword", "Password123")
//                 .param("accountType", "BUSINESS")
//                 .param("postalCode", "123456")  // Too long
//                 .param("termsAccepted", "true")
//                 .param("privacyAccepted", "true")
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isBadRequest())
//                 .andExpect(jsonPath("$.errors.postalCode", containsString("PLZ muss genau 5 Zeichen haben")))
//                 .andExpect(jsonPath("$.fieldTypes.postalCode", is("postal_code")));
//     }

//     @Test
//     void testMultipleValidationErrors() throws Exception {
//         mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "invalid-email")  // Invalid email
//                 .param("password", "123")         // Too short password
//                 .param("confirmPassword", "456")  // Mismatched password
//                 .param("accountType", "BUSINESS")
//                 .param("postalCode", "abc")       // Invalid postal code
//                 .param("companyPostalCode", "12-34") // Invalid company postal code
//                 .param("termsAccepted", "false")  // Terms not accepted
//                 .param("privacyAccepted", "false") // Privacy not accepted
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isBadRequest())
//                 .andExpect(jsonPath("$.errors.email", containsString("E-Mail-Format ist ungültig")))
//                 .andExpect(jsonPath("$.errors.password", containsString("Passwort muss mindestens")))
//                 .andExpect(jsonPath("$.errors.postalCode", containsString("PLZ muss genau 5 Zeichen haben")))
//                 .andExpect(jsonPath("$.errors.companyPostalCode", containsString("PLZ darf nur Zahlen enthalten")))
//                 .andExpect(jsonPath("$.fieldTypes.email", is("email")))
//                 .andExpect(jsonPath("$.fieldTypes.password", is("password")))
//                 .andExpect(jsonPath("$.fieldTypes.postalCode", is("postal_code")))
//                 .andExpect(jsonPath("$.fieldTypes.companyPostalCode", is("postal_code")));
//     }

//     @Test
//     void testValidationErrorResponseStructure() throws Exception {
//         MvcResult result = mockMvc.perform(multipart("/v1/auth/register")
//                 .param("email", "test@example.com")
//                 .param("password", "Password123")
//                 .param("confirmPassword", "Password123")
//                 .param("accountType", "BUSINESS")
//                 .param("companyPostalCode", "dasf")
//                 .param("termsAccepted", "true")
//                 .param("privacyAccepted", "true")
//                 .contentType(MediaType.MULTIPART_FORM_DATA))
//                 .andExpect(status().isBadRequest())
//                 .andExpect(jsonPath("$.timestamp").exists())
//                 .andExpect(jsonPath("$.status", is(400)))
//                 .andExpect(jsonPath("$.message").exists())
//                 .andExpect(jsonPath("$.errors").exists())
//                 .andExpect(jsonPath("$.fieldTypes").exists())
//                 .andReturn();

//         // Verify the response structure matches our ValidationErrorResponse
//         String responseContent = result.getResponse().getContentAsString();
//         System.out.println("Full validation error response: " + responseContent);
//     }
// }