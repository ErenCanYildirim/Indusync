package com.indusync.indusync_backend.shared.exception;

import com.indusync.indusync_backend.authentication.application.AuthenticationApplicationService;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // === Authentication Exception Handlers ===

    @ExceptionHandler(AuthenticationApplicationService.InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentialsException(
            AuthenticationApplicationService.InvalidCredentialsException ex, WebRequest request) {
        log.warn("Invalid credentials exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationApplicationService.AccountDeactivatedException.class)
    public ResponseEntity<ErrorResponse> handleAccountDeactivatedException(
            AuthenticationApplicationService.AccountDeactivatedException ex, WebRequest request) {
        log.warn("Account deactivated exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationApplicationService.AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLockedException(
            AuthenticationApplicationService.AccountLockedException ex, WebRequest request) {
        log.warn("Account locked exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationApplicationService.EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExistsException(
            AuthenticationApplicationService.EmailAlreadyExistsException ex, WebRequest request) {
        log.warn("Email already exists exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationApplicationService.PasswordMismatchException.class)
    public ResponseEntity<ErrorResponse> handlePasswordMismatchException(
            AuthenticationApplicationService.PasswordMismatchException ex, WebRequest request) {
        log.warn("Password mismatch exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationApplicationService.UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFoundException(
            AuthenticationApplicationService.UserNotFoundException ex, WebRequest request) {
        log.warn("User not found exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // === General Exception Handlers ===

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        log.warn("Bad credentials exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, "Ungültige Anmeldedaten", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex, WebRequest request) {
        log.warn("Authentication exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, "Authentifizierung fehlgeschlagen", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.FORBIDDEN, "Zugriff verweigert", request);
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleResourceAlreadyExistsException(
            ResourceAlreadyExistsException ex, WebRequest request) {
        log.warn("Resource already exists exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // === Validation Exception Handlers ===

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        log.warn("Validation exception: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        Map<String, String> fieldTypes = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();

            // Add field type information for better frontend handling
            if (fieldName.contains("postalCode") || fieldName.contains("PostalCode")) {
                fieldTypes.put(fieldName, "postal_code");
            } else if (fieldName.contains("email") || fieldName.contains("Email")) {
                fieldTypes.put(fieldName, "email");
            } else if (fieldName.contains("password") || fieldName.contains("Password")) {
                fieldTypes.put(fieldName, "password");
            } else {
                fieldTypes.put(fieldName, "text");
            }

            errors.put(fieldName, errorMessage);

            // Log specific postal code validation errors for monitoring
            if (fieldName.contains("postalCode") || fieldName.contains("PostalCode")) {
                log.info("Postal code validation failed for field '{}': {}", fieldName, errorMessage);
            }
        });

        ValidationErrorResponse errorResponse = ValidationErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Validierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.")
                .errors(errors)
                .fieldTypes(fieldTypes)
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex, WebRequest request) {
        log.warn("Constraint violation exception: {}", ex.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "Eingabedaten sind ungültig", request);
    }

    // === Generic Exception Handler ===

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Unexpected exception occurred", ex);
        return createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ein unerwarteter Fehler ist aufgetreten",
                request);
    }

    // === Helper Methods ===

    private ResponseEntity<ErrorResponse> createErrorResponse(
            HttpStatus status, String message, WebRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .message(message)
                .path(extractPath(request))
                .build();

        return new ResponseEntity<>(errorResponse, status);
    }

    /**
     * Extract clean path from WebRequest description.
     */
    private String extractPath(WebRequest request) {
        String description = request.getDescription(false);
        if (description.startsWith("uri=")) {
            return description.substring(4);
        }
        return description;
    }
}