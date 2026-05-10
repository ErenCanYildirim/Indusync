package com.indusync.indusync_backend.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom validation annotation for German postal codes.
 * Validates that the postal code is exactly 5 digits.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Documented
@Constraint(validatedBy = PostalCodeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PostalCode {
    
    String message() default "PLZ muss genau 5 Ziffern haben (z.B. 12345). Bitte geben Sie nur Zahlen ein.";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Custom message for company postal codes
     */
    String companyMessage() default "Firmen-PLZ muss genau 5 Ziffern haben (z.B. 12345). Bitte geben Sie nur Zahlen ein.";
}