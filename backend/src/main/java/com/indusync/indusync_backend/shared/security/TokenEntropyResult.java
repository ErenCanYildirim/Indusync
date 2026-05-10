package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

/**
 * Result of token entropy validation.
 * Contains detailed analysis of JWT token entropy and security characteristics.
 *
 * @param valid            Whether the token passed entropy validation
 * @param headerEntropy    Entropy analysis of the JWT header
 * @param payloadEntropy   Entropy analysis of the JWT payload
 * @param signatureEntropy Entropy analysis of the JWT signature
 * @param overallScore     Overall entropy score (0.0 to 1.0)
 * @param failureReason    Reason for validation failure (if any)
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record TokenEntropyResult(boolean valid, EntropyAnalysis headerEntropy, EntropyAnalysis payloadEntropy,
                                 EntropyAnalysis signatureEntropy, double overallScore, String failureReason) {

    /**
     * Create an invalid result with reason
     */
    public static TokenEntropyResult invalid(String reason) {
        return TokenEntropyResult.builder()
                .valid(false)
                .failureReason(reason)
                .overallScore(0.0)
                .build();
    }

    /**
     * Create a valid result
     */
    public static TokenEntropyResult valid(EntropyAnalysis header, EntropyAnalysis payload,
                                           EntropyAnalysis signature, double score) {
        return TokenEntropyResult.builder()
                .valid(true)
                .headerEntropy(header)
                .payloadEntropy(payload)
                .signatureEntropy(signature)
                .overallScore(score)
                .build();
    }
}