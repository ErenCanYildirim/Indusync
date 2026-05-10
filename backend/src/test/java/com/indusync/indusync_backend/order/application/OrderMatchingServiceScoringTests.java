package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.order.domain.OrderMatchRepository;
import com.indusync.indusync_backend.order.domain.OrderPublishedEvent;
import com.indusync.indusync_backend.shared.taxonomy.SkillTaxonomyService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Focused unit tests for the private scoring helpers inside
 * OrderMatchingService.
 * Uses reflection to invoke non-public methods so we can validate business
 * logic without
 * changing production visibility.
 */
@ExtendWith(MockitoExtension.class)
class OrderMatchingServiceScoringTests {

    @Mock
    CompanyRepository companyRepository;
    @Mock
    OrderMatchRepository orderMatchRepository;
    @Mock
    ApplicationEventPublisher publisher;

    @Mock
    MeterRegistry meterRegistry;




    SkillTaxonomyService taxonomyService;
    OrderMatchingService service;

    @BeforeEach
    void setUp() {
        taxonomyService = new SkillTaxonomyService();
        // Manually call @PostConstruct
        ReflectionTestUtils.invokeMethod(taxonomyService, "init");
        service = new OrderMatchingService(companyRepository,
                orderMatchRepository,
                taxonomyService,
                publisher,
                meterRegistry
                );
    }

    @Test
    @DisplayName("Skills score – exact match = 1.0")
    void testSkillsScoreExact() throws Exception {
        OrderPublishedEvent event = OrderPublishedEvent.builder()
                .orderId(UUID.randomUUID())
                .requiredSpecializations(List.of("sps"))
                .build();
        Company provider = new Company();
        provider.setSpecializations(List.of("sps"));

        BigDecimal score = invokeSkillsScore(event, provider);
        assertThat(score).isEqualByComparingTo("1.0");
    }

    @Test
    @DisplayName("Skills score – same category = 0.2")
    void testSkillsScoreSameCategory() {
        OrderPublishedEvent event = OrderPublishedEvent.builder()
                .orderId(UUID.randomUUID())
                .requiredSpecializations(List.of("sps"))
                .build();
        Company provider = new Company();
        provider.setSpecializations(List.of("knx")); // same Elektrotechnik category

        BigDecimal score = invokeSkillsScore(event, provider);
        assertThat(score).isEqualByComparingTo("0.2");
    }

    @Test
    @DisplayName("Verification score – not verified floors at 0.2")
    void testVerificationScoreFloor() {
        OrderPublishedEvent event = OrderPublishedEvent.builder()
                .orderId(UUID.randomUUID())
                .requiredVerifications(List.of("verified"))
                .build();
        Company provider = new Company();
        provider.setVerified(false);

        BigDecimal score = invokeVerificationScore(event, provider);
        assertThat(score).isEqualByComparingTo("0.2");
    }

    @Test
    @DisplayName("Contract type score – requirement returns 0.5 when provider capability unknown")
    void testContractScorePartial() {
        OrderPublishedEvent event = OrderPublishedEvent.builder()
                .orderId(UUID.randomUUID())
                .placementTypes(Set.of("public"))
                .build();
        Company provider = new Company();

        BigDecimal score = invokeContractScore(event, provider);
        assertThat(score).isEqualByComparingTo("0.5");
    }

    // === Reflection helpers ===
    private BigDecimal invokeSkillsScore(OrderPublishedEvent e, Company c) {
        return (BigDecimal) ReflectionTestUtils.invokeMethod(service, "calculateSkillsScore", e, c);
    }

    private BigDecimal invokeVerificationScore(OrderPublishedEvent e, Company c) {
        return (BigDecimal) ReflectionTestUtils.invokeMethod(service, "calculateVerificationScore", e, c);
    }

    private BigDecimal invokeContractScore(OrderPublishedEvent e, Company c) {
        return (BigDecimal) ReflectionTestUtils.invokeMethod(service, "calculateContractScore", e, c);
    }
}