/**
     * Get current user ID from authentication context.
     */
    protected UUID getCurrentUserId(Authentication authentication) {
        return authHelper.extractUserIdFromAuthentication(authentication);
    }
    
    /**
     * Get current company ID from authentication context.
     */
    protected UUID getCurrentCompanyId(Authentication authentication) {
        return authHelper.extractCurrentCompanyIdFromAuthentication(authentication);
    }
    
    /**
     * Get complete authentication context.
     */
    protected Optional<AuthenticationContext> getAuthContext(Authentication authentication) {
        return authHelper.getAuthenticationContext(authentication);
    }
    
    /**
     * Validate authentication and return context, or null if invalid.
     */
    protected AuthenticationContext validateAuthentication(Authentication authentication) {
        Optional<AuthenticationContext> context = getAuthContext(authentication);
        if (context.isEmpty()) {
            log.warn("Invalid authentication context");
            return null;
        }
        return context.get();
    }
    
    /**
     * Validate authentication and ensure company context exists.
     */
    protected AuthenticationContext validateAuthenticationWithCompany(Authentication authentication) {
        AuthenticationContext context = validateAuthentication(authentication);
        if (context == null) {
            return null;
        }
        
        if (!context.hasValidCompanyContext()) {
            log.warn("User {} has no valid company context", context.userId());
            return null;
        }
        
        return context;
    }
    
    /**
     * Create unauthorized response.
     */
    protected ResponseEntity<ErrorResponse> handleUnauthorized(String path) {
        return responseHelper.unauthorizedResponse(path);
    }
    
    /**
     * Create unauthorized response with custom message.
     */
    protected ResponseEntity<ErrorResponse> handleUnauthorized(String message, String path) {
        return responseHelper.unauthorizedResponse(message, path);
    }
    
    /**
     * Create forbidden response.
     */
    protected ResponseEntity<ErrorResponse> handleForbidden(String message, String path) {
        return responseHelper.forbiddenResponse(message, path);
    }
    
    /**
     * Create forbidden response with default message.
     */
    protected ResponseEntity<ErrorResponse> handleForbidden(String path) {
        return responseHelper.forbiddenResponse(path);
    }
    
    /**
     * Create not found response.
     */
    protected ResponseEntity<ErrorResponse> handleNotFound(String message, String path) {
        return responseHelper.notFoundResponse(message, path);
    }
    
    /**
     * Create not found response with default message.
     */
    protected ResponseEntity<ErrorResponse> handleNotFound(String path) {
        return responseHelper.notFoundResponse(path);
    }
    
    /**
     * Create bad request response.
     */
    protected ResponseEntity<ErrorResponse> handleBadRequest(String message, String path) {
        return responseHelper.badRequestResponse(message, path);
    }
    
    /**
     * Create bad request response with default message.
     */
    protected ResponseEntity<ErrorResponse> handleBadRequest(String path) {
        return responseHelper.badRequestResponse(path);
    }
    
    /**
     * Create validation error response.
     */
    protected ResponseEntity<ErrorResponse> handleValidationError(String message, String path) {
        return responseHelper.validationErrorResponse(message, path);
    }
    
    /**
     * Create internal server error response.
     */
    protected ResponseEntity<ErrorResponse> handleInternalServerError(String path) {
        return responseHelper.internalServerErrorResponse(path);
    }
    
    /**
     * Create internal server error response with custom message.
     */
    protected ResponseEntity<ErrorResponse> handleInternalServerError(String message, String path) {
        return responseHelper.internalServerErrorResponse(message, path);
    }
    
    /**
     * Create conflict response.
     */
    protected ResponseEntity<ErrorResponse> handleConflict(String message, String path) {
        return responseHelper.conflictResponse(message, path);
    }
    
    /**
     * Create company context missing response.
     */
    protected ResponseEntity<ErrorResponse> handleNoCompanyContext(String path) {
        return responseHelper.noCompanyContextResponse(path);
    }
    
    /**
     * Create invalid token response.
     */
    protected ResponseEntity<ErrorResponse> handleInvalidToken(String path) {
        return responseHelper.invalidTokenResponse(path);
    }
    
    /**
     * Create insufficient permissions response.
     */
    protected ResponseEntity<ErrorResponse> handleInsufficientPermissions(String path) {
        return responseHelper.insufficientPermissionsResponse(path);
    }
    
    /**
     * Helper method to get the current request path for error responses.
     */
    protected String getCurrentRequestPath() {
        try {
            RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes()).getRequest();
            return request.getRequestURI();
        } catch (Exception e) {
            return "unknown";
        }
    }