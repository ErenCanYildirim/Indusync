package com.indusync.indusync_backend.order.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProviderShowedInterestEvent(
    UUID orderId,
    UUID clientCompanyId,
    UUID providerCompanyId,
    LocalDateTime interestedAt
) {} 