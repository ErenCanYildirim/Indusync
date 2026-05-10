package com.indusync.indusync_backend.shared.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private Map<String, String> errors;
    private Map<String, String> fieldTypes; // Additional field type information for frontend

    public static ValidationErrorResponseBuilder builder() {
        return new ValidationErrorResponseBuilder();
    }

    public static class ValidationErrorResponseBuilder {
        private LocalDateTime timestamp;
        private int status;
        private String message;
        private Map<String, String> errors;
        private Map<String, String> fieldTypes;

        public ValidationErrorResponseBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public ValidationErrorResponseBuilder status(int status) {
            this.status = status;
            return this;
        }

        public ValidationErrorResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public ValidationErrorResponseBuilder errors(Map<String, String> errors) {
            this.errors = errors;
            return this;
        }

        public ValidationErrorResponseBuilder fieldTypes(Map<String, String> fieldTypes) {
            this.fieldTypes = fieldTypes;
            return this;
        }

        public ValidationErrorResponse build() {
            return new ValidationErrorResponse(timestamp, status, message, errors, fieldTypes);
        }
    }
}