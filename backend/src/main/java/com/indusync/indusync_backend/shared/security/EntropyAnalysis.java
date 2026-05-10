package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

/**
 * Analysis result for entropy validation of strings.
 * Contains metrics about randomness and security characteristics.
 *
 * @param entropyRatio     Ratio of unique characters to total length
 * @param uniqueCharacters Number of unique characters in the string
 * @param acceptable       Whether the entropy is acceptable for security purposes
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record EntropyAnalysis(double entropyRatio, int uniqueCharacters, boolean acceptable) {

}