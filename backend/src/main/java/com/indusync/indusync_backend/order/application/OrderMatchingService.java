package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.*;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.taxonomy.SkillTaxonomyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import io.micrometer.core.instrument.MeterRegistry;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for order matching algorithm implementation.
 * <p>
 * Implements the scoring algorithm as defined in Sprint 2 requirements:
 * <ul>
 * <li>20% industry branch</li>
 * <li>10% contract type</li>
 * <li>5% verification status</li>
 * <li>35% skills</li>
 * <li>10% certificates</li>
 * <li>20% operational radius</li>
 * </ul>
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderMatchingService {

    private final CompanyRepository companyRepository;
    private final OrderMatchRepository orderMatchRepository;
    private final SkillTaxonomyService skillTaxonomyService;
    private final ApplicationEventPublisher eventPublisher;
    private final MeterRegistry meterRegistry;

    // Scoring weights as defined in sprint-2.md
    private static final BigDecimal INDUSTRY_WEIGHT = new BigDecimal("0.20");
    private static final BigDecimal CONTRACT_WEIGHT = new BigDecimal("0.10");
    private static final BigDecimal VERIFICATION_WEIGHT = new BigDecimal("0.05");
    private static final BigDecimal SKILLS_WEIGHT = new BigDecimal("0.35");
    private static final BigDecimal CERTIFICATES_WEIGHT = new BigDecimal("0.10");
    private static final BigDecimal RADIUS_WEIGHT = new BigDecimal("0.20");

    private BigDecimal getWeight(OrderPublishedEvent event, String key, BigDecimal defaultWeight) {
        if (event.weightOverrides() != null && event.weightOverrides().containsKey(key)) {
            return event.weightOverrides().get(key);
        }
        return defaultWeight;
    }

    /**
     * Processes order matching when an order is published.
     * Finds suitable provider companies and creates match records.
     *
     * @param orderPublishedEvent the order published event
     */
    public void processOrderMatching(OrderPublishedEvent orderPublishedEvent) {
        var sample = io.micrometer.core.instrument.Timer.start(meterRegistry);

        log.info("Processing order matching for order: {} with radius: {}km",
                orderPublishedEvent.orderId(), orderPublishedEvent.searchRadiusKm());

        try {
            // Step 1: Find potential providers within geographic radius
            List<Company> nearbyProviders = findProvidersWithinRadius(orderPublishedEvent);

            // Metric: count candidates evaluated
            meterRegistry.counter("order_matching_candidates_total").increment(nearbyProviders.size());

            log.info("Found {} providers within {}km of order {}",
                    nearbyProviders.size(), orderPublishedEvent.searchRadiusKm(), orderPublishedEvent.orderId());

            // Step 2: Calculate match scores for each provider
            List<OrderMatch> matches = nearbyProviders.stream()
                    .map(provider -> calculateMatch(orderPublishedEvent, provider))
                    .filter(match -> match.getMatchScore().compareTo(BigDecimal.ZERO) > 0) // Only keep matches with
                                                                                           // score > 0
                    .collect(Collectors.toList());

            // Step 3: Save matches to database
            List<OrderMatch> savedMatches = orderMatchRepository.saveAll(matches);

            // Metric: matches created
            meterRegistry.counter("order_matches_created_total").increment(savedMatches.size());

            double avg = savedMatches.stream().mapToDouble(m -> m.getMatchScore().doubleValue()).average().orElse(0.0);

            // Metric: record score distribution
            io.micrometer.core.instrument.DistributionSummary summary = meterRegistry
                    .summary("order_match_score_distribution");
            savedMatches.forEach(m -> summary.record(m.getMatchScore().doubleValue()));

            log.info("Created {} matches for order {} (avg score: {:.2f})",
                    savedMatches.size(),
                    orderPublishedEvent.orderId(), avg);

            // Publish OrderMatchedEvent
            try {
                java.util.List<java.util.UUID> providerIds = savedMatches.stream()
                        .map(OrderMatch::getProviderId)
                        .toList();
                eventPublisher.publishEvent(com.indusync.indusync_backend.order.domain.OrderMatchedEvent.builder()
                        .orderId(orderPublishedEvent.orderId())
                        .providerIds(providerIds)
                        .matchedAt(java.time.LocalDateTime.now())
                        .averageScore(avg)
                        .build());
            } catch (Exception e) {
                log.error("Failed to publish OrderMatchedEvent for order {}", orderPublishedEvent.orderId(), e);
            }

        } catch (Exception e) {
            meterRegistry.counter("order_matching_errors_total").increment();
            log.error("Error processing order matching for order: {}", orderPublishedEvent.orderId(), e);
            throw new OrderMatchingException("Failed to process order matching", e);
        } finally {
            sample.stop(meterRegistry.timer("order_matching_duration_seconds"));
        }
    }

    /**
     * Finds matches for preview purposes without saving to database.
     * Used by MatchingPreviewService to reuse the scoring logic.
     *
     * @param orderPublishedEvent the order published event
     * @return list of calculated matches (not saved to database)
     */
    public List<OrderMatch> findMatchesForPreview(OrderPublishedEvent orderPublishedEvent) {
        log.info("Finding matches for preview - order: {} with radius: {}km",
                orderPublishedEvent.orderId(), orderPublishedEvent.searchRadiusKm());

        try {
            // Step 1: Find potential providers within geographic radius
            List<Company> nearbyProviders = findProvidersWithinRadius(orderPublishedEvent);

            log.info("Found {} providers within {}km for preview",
                    nearbyProviders.size(), orderPublishedEvent.searchRadiusKm());

            // Step 2: Calculate match scores for each provider
            List<OrderMatch> matches = nearbyProviders.stream()
                    .map(provider -> calculateMatch(orderPublishedEvent, provider))
                    .filter(match -> match.getMatchScore().compareTo(BigDecimal.ZERO) > 0) // Only keep matches with
                                                                                           // score > 0
                    .sorted((m1, m2) -> m2.getMatchScore().compareTo(m1.getMatchScore())) // Sort by score descending
                    .collect(Collectors.toList());

            log.info("Calculated {} matches for preview (not saved to database)", matches.size());

            return matches;

        } catch (Exception e) {
            log.error("Error finding matches for preview: {}", orderPublishedEvent.orderId(), e);
            throw new OrderMatchingException("Failed to find matches for preview", e);
        }
    }

    /**
     * Finds service provider companies within the order's search radius.
     */
    private List<Company> findProvidersWithinRadius(OrderPublishedEvent event) {
        if (event.latitude() == null || event.longitude() == null) {
            log.warn("Order {} has no geographic coordinates, cannot perform geographic matching", event.orderId());
            return List.of();
        }

        // Use the existing CompanyRepository method that implements Haversine formula
        return companyRepository.findServiceProvidersWithinRadius(
                event.latitude(),
                event.longitude(),
                event.searchRadiusKm(),
                org.springframework.data.domain.PageRequest.of(0, 1000) // Limit to 1000 providers max
        );
    }

    /**
     * Calculates a match between an order and a provider company.
     */
    private OrderMatch calculateMatch(OrderPublishedEvent order, Company provider) {
        // Calculate distance
        BigDecimal distance = calculateDistance(order, provider);
        log.debug(order.toString());
        log.debug(provider.toString());

        // Calculate individual scores
        BigDecimal industryScore = calculateIndustryScore(order, provider);
        BigDecimal skillsScore = calculateSkillsScore(order, provider);
        BigDecimal contractScore = calculateContractScore(order, provider);
        BigDecimal certificatesScore = calculateCertificatesScore(order, provider);
        BigDecimal verificationScore = calculateVerificationScore(order, provider);
        BigDecimal radiusScore = calculateRadiusScore(order, provider, distance);

        // Calculate weighted overall score
        BigDecimal overallScore = industryScore.multiply(getWeight(order, "industry", INDUSTRY_WEIGHT))
                .add(skillsScore.multiply(getWeight(order, "skills", SKILLS_WEIGHT)))
                .add(contractScore.multiply(getWeight(order, "contract", CONTRACT_WEIGHT)))
                .add(certificatesScore.multiply(getWeight(order, "certificates", CERTIFICATES_WEIGHT)))
                .add(verificationScore.multiply(getWeight(order, "verification", VERIFICATION_WEIGHT)))
                .add(radiusScore.multiply(getWeight(order, "radius", RADIUS_WEIGHT)))
                .setScale(3, RoundingMode.HALF_UP);

        log.debug(
                "Match scores for provider {}: industry={}, skills={}, contract={}, certificates={}, verification={}, radius={}, overall={}",
                provider.getId(), industryScore, skillsScore, contractScore,
                certificatesScore, verificationScore, radiusScore, overallScore);

        return OrderMatch.builder()
                .orderId(order.orderId())
                .providerId(provider.getId())
                .matchScore(overallScore)
                .distanceKm(distance)
                .industryScore(industryScore)
                .skillsScore(skillsScore)
                .contractScore(contractScore)
                .certificatesScore(certificatesScore)
                .verificationScore(verificationScore)
                .radiusScore(radiusScore)
                .matchedAt(LocalDateTime.now())
                .interested(false)
                .notificationSent(false)
                .build();
    }

    /**
     * Calculates industry branch compatibility score.
     * Scoring: Exact match = 1.0, Different branch = 0.5
     */
    private BigDecimal calculateIndustryScore(OrderPublishedEvent order, Company provider) {
        Set<String> orderIndustries = order.targetIndustries();
        List<String> providerIndustries = provider.getIndustries();

        if (orderIndustries == null || orderIndustries.isEmpty()) {
            return new BigDecimal("0.5"); // Default score when no specific industry required
        }

        if (providerIndustries == null || providerIndustries.isEmpty()) {
            return new BigDecimal("0.2"); // Low score for providers without industry specification
        }

        // Check for exact industry matches
        long exactMatches = orderIndustries.stream()
                .mapToLong(industry -> providerIndustries.contains(industry) ? 1 : 0)
                .sum();

        if (exactMatches > 0) {
            // Calculate score based on a proportion of matching industries
            return BigDecimal.valueOf((double) exactMatches / orderIndustries.size())
                    .setScale(3, RoundingMode.HALF_UP);
        }

        return new BigDecimal("0.5"); // Different branch
    }

    /**
     * Calculates skills/specializations compatibility score.
     * Scoring: Exact skill = 1.0, Same category = 0.2
     */
    private BigDecimal calculateSkillsScore(OrderPublishedEvent order, Company provider) {
        List<String> required = order.requiredSpecializations();
        List<String> offered = provider.getSpecializations();

        if (required == null || required.isEmpty()) {
            return new BigDecimal("0.5"); // No specific skills required – neutral score
        }

        if (offered == null || offered.isEmpty()) {
            return new BigDecimal("0.1"); // Provider lists no skills
        }

        int totalRequired = required.size();
        double scoreSum = 0.0;

        for (String req : required) {
            if (offered.contains(req)) {
                // Exact match
                scoreSum += 1.0;
                continue;
            }

            // Same category?
            boolean sameCategory = offered.stream().anyMatch(off -> skillTaxonomyService.inSameCategory(req, off));
            if (sameCategory) {
                scoreSum += 0.2;
                continue;
            }

            // Fuzzy similarity (basic prefix check)
            boolean fuzzy = offered.stream().anyMatch(off -> skillTaxonomyService.fuzzySimilar(req, off));
            if (fuzzy) {
                scoreSum += 0.6;
            }
        }

        return BigDecimal.valueOf(scoreSum / totalRequired).setScale(3, RoundingMode.HALF_UP);
    }

    /**
     * Calculates contract type compatibility score.
     * Scoring: Exact match = 1.0, Other type = 0.5
     */
    private BigDecimal calculateContractScore(OrderPublishedEvent order, Company provider) {
        Set<String> orderPlacementTypes = order.placementTypes();

        if (orderPlacementTypes == null || orderPlacementTypes.isEmpty()) {
            return new BigDecimal("1.0"); // No specific contract type required
        }

        // TODO: Once Company has placementTypes field, compare sets for exact match.
        // Without that data, treat unknown provider capability as partial
        // compatibility.
        return new BigDecimal("0.5");
    }

    /**
     * Calculates certificates compatibility score.
     * Scoring: Uploaded (per cert) = 1.0, Not uploaded = 0.0
     */
    private BigDecimal calculateCertificatesScore(OrderPublishedEvent order, Company provider) {
        List<String> requiredCertifications = order.requiredCertifications();
        List<String> providerCertifications = provider.getCertifications();

        // If no certifications required, perfect score
        if (requiredCertifications == null || requiredCertifications.isEmpty()) {
            return new BigDecimal("1.0");
        }

        // If provider has no certificates, zero score
        if (providerCertifications == null || providerCertifications.isEmpty()) {
            return BigDecimal.ZERO;
        }

        // Give full score if provider has uploaded any certificates
        return new BigDecimal("1.0");
    }

    /**
     * Calculates verification status score.
     * Scoring: Verified = 1.0, Not verified = 0.2
     */
    private BigDecimal calculateVerificationScore(OrderPublishedEvent order, Company provider) {
        List<String> requiredVerifications = order.requiredVerifications();

        if (requiredVerifications == null || requiredVerifications.isEmpty()) {
            return new BigDecimal("1.0"); // No specific verification required
        }

        // Check if the provider meets verification requirements
        boolean isVerified = provider.getVerified();
        boolean hasInsurance = provider.getInsuranceCoverage() != null;
        boolean hasEmployees = provider.getEmployeeCount() != null && provider.getEmployeeCount() > 0;

        int verificationScore = 0;
        int totalRequirements = requiredVerifications.size();

        for (String verification : requiredVerifications) {
            switch (verification.toLowerCase()) {
                case "verified":
                case "registered":
                    if (isVerified)
                        verificationScore++;
                    break;
                case "insured":
                case "insurance":
                    if (hasInsurance)
                        verificationScore++;
                    break;
                case "employees":
                    if (hasEmployees)
                        verificationScore++;
                    break;
                default:
                    // Unknown verification requirement
                    if (isVerified)
                        verificationScore++; // Give the benefit of doubt to verified companies
                    break;
            }
        }

        BigDecimal ratio = BigDecimal.valueOf((double) verificationScore / totalRequirements).setScale(3,
                RoundingMode.HALF_UP);

        // Sprint-2 spec: minimum 0.2 when any requirement is missing
        if (ratio.compareTo(new BigDecimal("0.2")) < 0 && verificationScore < totalRequirements) {
            return new BigDecimal("0.2");
        }
        return ratio;
    }

    /**
     * Calculates operational radius compatibility score.
     * Scoring: Radii overlap = 1.0, Difference ≤10km = 0.5, Otherwise = 0.0
     */
    private BigDecimal calculateRadiusScore(OrderPublishedEvent order, Company provider, BigDecimal distance) {
        Integer providerRadius = provider.getWorkRadiusKm();

        if (providerRadius == null) {
            // Provider has no defined operational radius, use distance-based scoring
            return distance.compareTo(BigDecimal.valueOf(50)) <= 0 ? new BigDecimal("1.0") : new BigDecimal("0.5");
        }

        // Check if order location is within provider's operational radius
        if (distance.compareTo(BigDecimal.valueOf(providerRadius)) <= 0) {
            return new BigDecimal("1.0"); // Radii overlap
        }

        // Check if the difference is ≤10km
        BigDecimal difference = distance.subtract(BigDecimal.valueOf(providerRadius));
        if (difference.compareTo(BigDecimal.valueOf(10)) <= 0) {
            return new BigDecimal("0.5"); // Difference ≤10km
        }

        return BigDecimal.ZERO; // Otherwise
    }

    /**
     * Calculates distance between order location and provider location using
     * Haversine formula.
     */
    private BigDecimal calculateDistance(OrderPublishedEvent order, Company provider) {
        if (order.latitude() == null || order.longitude() == null ||
                provider.getLocation() == null ||
                provider.getLocation().getLatitude() == null ||
                provider.getLocation().getLongitude() == null) {
            return BigDecimal.ZERO; // Cannot calculate distance
        }

        double c = getADouble(order, provider);
        double distance = 6371 * c; // Earth's radius in kilometers

        return BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP);
    }

    private static double getADouble(OrderPublishedEvent order, Company provider) {
        double lat1 = order.latitude();
        double lon1 = order.longitude();
        double lat2 = provider.getLocation().getLatitude().doubleValue();
        double lon2 = provider.getLocation().getLongitude().doubleValue();

        // Haversine formula
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Gets all matches for an order.
     */
    public List<OrderMatch> getOrderMatches(UUID orderId) {
        return orderMatchRepository.findByOrderId(orderId);
    }

    /**
     * Gets available orders for a provider (based on existing matches).
     */
    public Page<OrderMatch> getAvailableOrdersForProvider(UUID providerId, Pageable pageable) {
        return orderMatchRepository.findAvailableOrdersForProvider(providerId, pageable);
    }

    /**
     * Gets high-quality matches for a provider (score >= threshold).
     */
    public Page<OrderMatch> getHighQualityMatchesForProvider(UUID providerId, BigDecimal minScore, Pageable pageable) {
        return orderMatchRepository.findHighQualityMatchesForProvider(providerId, minScore, pageable);
    }

    /**
     * Gets unviewed matches for a provider.
     */
    public Page<OrderMatch> getUnviewedMatchesForProvider(UUID providerId, Pageable pageable) {
        return orderMatchRepository.findUnviewedMatchesForProvider(providerId, pageable);
    }

    /**
     * Gets paginated matches for an order.
     */
    public org.springframework.data.domain.Page<OrderMatch> getOrderMatches(java.util.UUID orderId,
            org.springframework.data.domain.Pageable pageable) {
        return orderMatchRepository.findByOrderIdOrderByMatchScoreDesc(orderId, pageable);
    }

    /**
     * Custom exception for order matching errors.
     */
    public static class OrderMatchingException extends RuntimeException {
        public OrderMatchingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}