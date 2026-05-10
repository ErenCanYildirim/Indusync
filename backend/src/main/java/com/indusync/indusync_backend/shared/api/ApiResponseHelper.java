package com.indusync.indusync_backend.shared.api;

import com.indusync.indusync_backend.shared.exception.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Helper class for creating consistent API error responses.
 * Centralizes error response creation logic across all controllers.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Component
@Slf4j
public class ApiResponseHelper {

    /**
     * Create an unauthorized (401) error response.
     */
    public ResponseEntity<ErrorResponse> unauthorizedResponse(String path) {
        return unauthorizedResponse("Authentifizierung erforderlich", path);
    }
    
    /**
     * Create an unauthorized (401) error response with custom message.
     */
    public ResponseEntity<ErrorResponse> unauthorizedResponse(String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.UNAUTHORIZED.value())
            .message(message)
            .path(path)
            .build();
            
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    /**
     * Create a forbidden (403) error response.
     */
    public ResponseEntity<ErrorResponse> forbiddenResponse(String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.FORBIDDEN.value())
            .message(message)
            .path(path)
            .build();
            
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    /**
     * Create a forbidden (403) error response with default message.
     */
    public ResponseEntity<ErrorResponse> forbiddenResponse(String path) {
        return forbiddenResponse("Zugriff verweigert", path);
    }
    
    /**
     * Create a not found (404) error response.
     */
    public ResponseEntity<ErrorResponse> notFoundResponse(String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.NOT_FOUND.value())
            .message(message)
            .path(path)
            .build();
            
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

     
    /**
     * Create a not found (404) error response with default message.
     */
    public ResponseEntity<ErrorResponse> notFoundResponse(String path) {
        return notFoundResponse("Ressource nicht gefunden", path);
    }
    
    /**
     * Create a bad request (400) error response.
     */
    public ResponseEntity<ErrorResponse> badRequestResponse(String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .message(message)
            .path(path)
            .build();
            
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
    
    /**
     * Create a bad request (400) error response with default message.
     */
    public ResponseEntity<ErrorResponse> badRequestResponse(String path) {
        return badRequestResponse("Ungültige Anfrage", path);
    }
    
    /**
     * Create an internal server error (500) response.
     */
    public ResponseEntity<ErrorResponse> internalServerErrorResponse(String path) {
        return internalServerErrorResponse("Ein interner Serverfehler ist aufgetreten", path);
    }
    
    /**
     * Create an internal server error (500) response with custom message.
     */
    public ResponseEntity<ErrorResponse> internalServerErrorResponse(String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .message(message)
            .path(path)
            .build();
            
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
    
    /**
     * Create a validation error response (400) with specific validation message.
     */
    public ResponseEntity<ErrorResponse> validationErrorResponse(String message, String path) {
        return badRequestResponse("Validierungsfehler: " + message, path);
    }
    
    /**
     * Create a conflict error response (409).
     */
    public ResponseEntity<ErrorResponse> conflictResponse(String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.CONFLICT.value())
            .message(message)
            .path(path)
            .build();
            
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * Create a company context missing error response.
     */
    public ResponseEntity<ErrorResponse> noCompanyContextResponse(String path) {
        return forbiddenResponse("Kein gültiger Unternehmenskontext gefunden", path);
    }
    
    /**
     * Create an invalid token error response.
     */
    public ResponseEntity<ErrorResponse> invalidTokenResponse(String path) {
        return unauthorizedResponse("Ungültiger Token", path);
    }
    
    /**
     * Create a response for when user doesn't have required permissions.
     */
    public ResponseEntity<ErrorResponse> insufficientPermissionsResponse(String path) {
        return forbiddenResponse("Unzureichende Berechtigungen", path);
    }
}