package com.indusync.indusync_backend;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Tests that verify the modular structure of the application.
 * This ensures that module boundaries are respected and dependencies
 * between modules are as expected.
 */
class ModularityTests {

    /**
     * Verifies that the application's modular structure is valid.
     * This test will fail if:
     * - There are cyclic dependencies between modules
     * - A module accesses another module's internal types
     * - A module depends on modules not explicitly allowed
     */
    @Test
    void verifyModularity() {
        ApplicationModules.of(IndusyncBackendApplication.class).verify();
    }

    /**
     * Generates documentation for the application's modular structure.
     * This includes component diagrams and the Application Module Canvas.
     */
    @Test
    void generateModuleDocumentation() {
        var modules = ApplicationModules.of(IndusyncBackendApplication.class);

        new Documenter(modules)
                .writeModulesAsPlantUml()
                .writeIndividualModulesAsPlantUml();
    }
}