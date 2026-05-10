package com.indusync.indusync_backend.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.extern.slf4j.Slf4j;

/**
 * Validator for German postal codes.
 * Validates that the postal code is exactly 5 digits and provides detailed error messages.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Slf4j
public class PostalCodeValidator implements ConstraintValidator<PostalCode, String> {
    
    private static final String POSTAL_CODE_PATTERN = "^\\d{5}$";
    
    @Override
    public void initialize(PostalCode constraintAnnotation) {
        // No initialization needed
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Null values are handled by @NotNull/@NotBlank annotations
        if (value == null || value.trim().isEmpty()) {
            return true;
        }
        
        String trimmedValue = value.trim();
        
        // Check if it matches the pattern
        if (!trimmedValue.matches(POSTAL_CODE_PATTERN)) {
            log.debug("Invalid postal code format: '{}'. Expected exactly 5 digits.", value);
            
            // Provide more specific error messages based on the type of error
            context.disableDefaultConstraintViolation();
            
            if (trimmedValue.length() != 5) {
                context.buildConstraintViolationWithTemplate(
                    String.format("PLZ muss genau 5 Zeichen haben (eingegeben: %d Zeichen). Beispiel: 12345", 
                                trimmedValue.length())
                ).addConstraintViolation();
            } else if (!trimmedValue.matches("^\\d+$")) {
                context.buildConstraintViolationWithTemplate(
                    "PLZ darf nur Zahlen enthalten (0-9). Bitte entfernen Sie Buchstaben, Leerzeichen oder Sonderzeichen."
                ).addConstraintViolation();
            } else {
                context.buildConstraintViolationWithTemplate(
                    "PLZ muss genau 5 Ziffern haben (z.B. 12345). Bitte geben Sie nur Zahlen ein."
                ).addConstraintViolation();
            }
            
            return false;
        }
        
        return true;
    }
}