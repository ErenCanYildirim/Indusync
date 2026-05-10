package com.indusync.indusync_backend.shared.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Flyway repair configuration to handle checksum mismatches.
 * This configuration is only active in development profile.
 */
@Configuration
@Profile("dev")
public class FlywayRepairConfig {

    /**
     * Custom Flyway migration strategy that repairs the schema history
     * before running migrations. This fixes checksum mismatches.
     */
    @Bean
    public FlywayMigrationStrategy repairStrategy() {
        return flyway -> {
            // Repair the schema history to fix checksum mismatches
            flyway.repair();
            // Then run the migrations
            flyway.migrate();
        };
    }
}