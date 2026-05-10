package com.indusync.indusync_backend.company.api;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public API controller providing reference data for frontend forms.
 * <p>
 * This controller provides public endpoints for frontend components to fetch
 * specializations, industries, order categories, and other reference data
 * needed for registration and company setup forms.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/public/data")
@RequiredArgsConstructor
@Slf4j
public class PublicDataController {

        /**
         * Gets the hierarchical specialization categories for the frontend.
         * This endpoint provides the structured specialization data that matches
         * the frontend's actual_specializations structure.
         */
        @GetMapping("/specializations")
        public ResponseEntity<List<SpecializationCategoryDto>> getSpecializations() {
                log.debug("Fetching specialization categories");

                List<SpecializationCategoryDto> specializations = List.of(
                                SpecializationCategoryDto.builder()
                                                .id("elektrotechnik")
                                                .name("Elektrotechnik")
                                                .subCategories(List.of(
                                                                SpecializationDto.builder().id("datentechnik")
                                                                                .name("Datentechnik").build(),
                                                                SpecializationDto.builder()
                                                                                .id("automatisierungstechnik")
                                                                                .name("Automatisierungstechnik")
                                                                                .build(),
                                                                SpecializationDto.builder().id("antriebstechnik")
                                                                                .name("Antriebstechnik").build(),
                                                                SpecializationDto.builder().id("schaltschrankbau")
                                                                                .name("Schaltschrankbau").build(),
                                                                SpecializationDto.builder().id("beleuchtungstechnik")
                                                                                .name("Beleuchtungstechnik")
                                                                                .build(),
                                                                SpecializationDto.builder()
                                                                                .id("programmierung")
                                                                                .name("Programmierung")
                                                                                .subCategories(List.of(
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("sps")
                                                                                                                .name("SPS")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("knx")
                                                                                                                .name("KNX")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("dasy")
                                                                                                                .name("DASY")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("logo")
                                                                                                                .name("LOGO")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("scada")
                                                                                                                .name("SCADA-Systeme")
                                                                                                                .build()))
                                                                                .build(),
                                                                SpecializationDto.builder()
                                                                                .id("energietechnik")
                                                                                .name("Energietechnik")
                                                                                .subCategories(List.of(
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("elektrospeicher")
                                                                                                                .name("Elektrospeicher")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("ladestation")
                                                                                                                .name("Ladestationen")
                                                                                                                .build()))
                                                                                .build(),
                                                                SpecializationDto.builder().id("kommunikationstechnik")
                                                                                .name("Kommunikationstechnik")
                                                                                .build(),
                                                                SpecializationDto.builder().id("regelungstechnik")
                                                                                .name("Regelungstechnik").build(),
                                                                SpecializationDto.builder().id("messtechnik")
                                                                                .name("Messtechnik").build(),
                                                                SpecializationDto.builder().id("mikrosystemtechnik")
                                                                                .name("Mikrosystemtechnik").build(),
                                                                SpecializationDto.builder().id("hochfrequenztechnik")
                                                                                .name("Hochfrequenztechnik")
                                                                                .build(),
                                                                SpecializationDto.builder().id("sensortechnik")
                                                                                .name("Sensortechnik").build(),
                                                                SpecializationDto.builder()
                                                                                .id("erneuerbare_energien")
                                                                                .name("Erneuerbare Energien")
                                                                                .subCategories(List.of(
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("wind")
                                                                                                                .name("Wind")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("solar")
                                                                                                                .name("Solar")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("wasserkraft")
                                                                                                                .name("Wasserkraft")
                                                                                                                .build(),
                                                                                                SpecializationDto
                                                                                                                .builder()
                                                                                                                .id("ladestationen")
                                                                                                                .name("Ladestationen")
                                                                                                                .build()))
                                                                                .build(),
                                                                SpecializationDto.builder().id("kabelverlegung")
                                                                                .name("Kabelverlegung").build(),
                                                                SpecializationDto.builder().id("kraftwerkstechnik")
                                                                                .name("Kraftwerkstechnik").build(),
                                                                SpecializationDto.builder().id("sonderleistung")
                                                                                .name("Sonderleistung").build()))
                                                .build(),

                                SpecializationCategoryDto.builder()
                                                .id("mechatronik")
                                                .name("Mechatronik")
                                                .subCategories(List.of(
                                                                SpecializationDto.builder().id("robotik")
                                                                                .name("Robotik").build(),
                                                                SpecializationDto.builder().id("hydraulik")
                                                                                .name("Hydraulik").build(),
                                                                SpecializationDto.builder().id("pneumatik")
                                                                                .name("Pneumatik").build(),
                                                                SpecializationDto.builder().id("sensortechnik")
                                                                                .name("Sensortechnik").build(),
                                                                SpecializationDto.builder().id("sonderleistung")
                                                                                .name("Sonderleistung").build()))
                                                .build(),

                                SpecializationCategoryDto.builder()
                                                .id("mechanik")
                                                .name("Mechanik / Stahlbau")
                                                .subCategories(List.of(
                                                                SpecializationDto.builder().id("maschinenbau")
                                                                                .name("Maschinenbau").build(),
                                                                SpecializationDto.builder().id("anlagenbau")
                                                                                .name("Anlagenbau").build(),
                                                                SpecializationDto.builder().id("blechbearbeitung")
                                                                                .name("Blechbearbeitung").build(),
                                                                SpecializationDto.builder().id("stahlbau/metallbau")
                                                                                .name("Stahlbau/Metallbau").build(),
                                                                SpecializationDto.builder().id("schweißen")
                                                                                .name("Schweißen").build(),
                                                                SpecializationDto.builder().id("oberfläche").name(
                                                                                "Oberfläche (Lackieren, Beschichten)")
                                                                                .build(),
                                                                SpecializationDto.builder().id("zerspannungstechnik")
                                                                                .name("Zerspannungstechnik")
                                                                                .build(),
                                                                SpecializationDto.builder().id("fluidtechnik")
                                                                                .name("Fluidtechnik").build(),
                                                                SpecializationDto.builder().id("thermodynamik")
                                                                                .name("Thermodynamik").build(),
                                                                SpecializationDto.builder().id("industriekletterer")
                                                                                .name("Industriekletterer").build(),
                                                                SpecializationDto.builder().id("sonderleistung")
                                                                                .name("Sonderleistung").build()))
                                                .build(),

                                SpecializationCategoryDto.builder()
                                                .id("trockenbau")
                                                .name("Trockenbau")
                                                .subCategories(List.of(
                                                                SpecializationDto.builder()
                                                                                .id("wand_und_deckenbekleidung")
                                                                                .name("Wand- und Deckenbekleidung")
                                                                                .build(),
                                                                SpecializationDto.builder().id("trennwände")
                                                                                .name("Trennwände").build(),
                                                                SpecializationDto.builder().id("schallschutz")
                                                                                .name("Schallschutz").build(),
                                                                SpecializationDto.builder().id("brandschutz")
                                                                                .name("Brandschutz").build(),
                                                                SpecializationDto.builder().id("dämmung")
                                                                                .name("Dämmung").build(),
                                                                SpecializationDto.builder().id("deckenabhängung")
                                                                                .name("Deckenabhängung").build(),
                                                                SpecializationDto.builder().id("bodenbeläge")
                                                                                .name("Bodenbeläge").build(),
                                                                SpecializationDto.builder().id("trockenputz")
                                                                                .name("Trockenputz").build(),
                                                                SpecializationDto.builder().id("akustik")
                                                                                .name("Akustidecken & -wände").build(),
                                                                SpecializationDto.builder().id("sonderleistung")
                                                                                .name("Sonderleistung").build()))
                                                .build());

                return ResponseEntity.ok(specializations);
        }

        /**
         * Gets industry categories for the frontend form.
         */
        @GetMapping("/industries")
        public ResponseEntity<List<IndustryCategoryDto>> getIndustries() {
                log.debug("Fetching industry categories");

                List<IndustryCategoryDto> industries = List.of(
                                IndustryCategoryDto.builder()
                                                .id("plant-engineering")
                                                .label("Anlagenbau")
                                                .build(),
                                IndustryCategoryDto.builder()
                                                .id("healthcare")
                                                .label("Gesundheitswesen")
                                                .build(),
                                IndustryCategoryDto.builder()
                                                .id("manufacturing")
                                                .label("Verarbeitende Industrie")
                                                .subCategories(List.of(
                                                                IndustryDto.builder().id("automotive")
                                                                                .label("Automobilindustrie").build(),
                                                                IndustryDto.builder().id("mechanical-engineering")
                                                                                .label("Maschinenbau").build(),
                                                                IndustryDto.builder().id("chemical")
                                                                                .label("Chemieindustrie").build(),
                                                                IndustryDto.builder().id("electrical")
                                                                                .label("Elektrotechnik und Elektronik")
                                                                                .build(),
                                                                IndustryDto.builder().id("metal")
                                                                                .label("Metallindustrie").build(),
                                                                IndustryDto.builder().id("plastics")
                                                                                .label("Kunststoffindustrie").build(),
                                                                IndustryDto.builder().id("pharmaceutical")
                                                                                .label("Pharmazeutische Industrie")
                                                                                .build(),
                                                                IndustryDto.builder().id("medical-technology")
                                                                                .label("Medizintechnik").build()))
                                                .build(),
                                IndustryCategoryDto.builder()
                                                .id("construction-infrastructure")
                                                .label("Bauwesen und Infrastruktur")
                                                .subCategories(List.of(
                                                                IndustryDto.builder().id("building-construction")
                                                                                .label("Hochbau").build(),
                                                                IndustryDto.builder().id("civil-engineering")
                                                                                .label("Tiefbau").build(),
                                                                IndustryDto.builder().id("shipbuilding").label(
                                                                                "Schiffbau und maritime Industrie")
                                                                                .build()))
                                                .build(),
                                IndustryCategoryDto.builder()
                                                .id("energy-environment")
                                                .label("Energie und Umwelt")
                                                .subCategories(List.of(
                                                                IndustryDto.builder().id("renewable-energy")
                                                                                .label("Erneuerbare Energien").build(),
                                                                IndustryDto.builder().id("environmental-technology")
                                                                                .label("Umwelttechnik").build()))
                                                .build(),
                                IndustryCategoryDto.builder()
                                                .id("technology-innovation")
                                                .label("Technologie und Innovation")
                                                .subCategories(List.of(
                                                                IndustryDto.builder().id("ict")
                                                                                .label("Informations- und Kommunikationstechnologie (IKT)")
                                                                                .build(),
                                                                IndustryDto.builder().id("biotechnology")
                                                                                .label("Biotechnologie").build(),
                                                                IndustryDto.builder().id("aerospace")
                                                                                .label("Luft- und Raumfahrtindustrie")
                                                                                .build()))
                                                .build());

                return ResponseEntity.ok(industries);
        }

        /**
         * Gets order categories for the frontend form.
         */
        @GetMapping("/order-categories")
        public ResponseEntity<List<OrderCategoryDto>> getOrderCategories() {
                log.debug("Fetching order categories");

                List<OrderCategoryDto> categories = List.of(
                                OrderCategoryDto.builder().id("CONSTRUCTION").label("Neubauprojekt").build(),
                                OrderCategoryDto.builder().id("MAINTENANCE").label("Instandhaltung").build(),
                                OrderCategoryDto.builder().id("EMERGENCY_REPAIR").label("Notfallservice").build(),
                                OrderCategoryDto.builder().id("CONSULTING").label("Beratung und Planung").build(),
                                OrderCategoryDto.builder().id("MECHANICAL_ENGINEERING").label("Montage").build(),
                                OrderCategoryDto.builder().id("ELECTRICAL_WORK").label("Elektrotechnik").build(),
                                OrderCategoryDto.builder().id("PLUMBING").label("Sanitärtechnik").build(),
                                OrderCategoryDto.builder().id("HVAC").label("Heizung/Lüftung/Klima").build(),
                                OrderCategoryDto.builder().id("INDUSTRIAL_CLEANING").label("Industriereinigung")
                                                .build(),
                                OrderCategoryDto.builder().id("WELDING").label("Schweißarbeiten").build(),
                                OrderCategoryDto.builder().id("PAINTING").label("Malerei/Beschichtung").build(),
                                OrderCategoryDto.builder().id("INSULATION").label("Isolierung").build(),
                                OrderCategoryDto.builder().id("AUTOMATION").label("Automatisierung").build(),
                                OrderCategoryDto.builder().id("INSTRUMENTATION").label("Messtechnik").build(),
                                OrderCategoryDto.builder().id("SAFETY_INSPECTION").label("Sicherheitsprüfung").build(),
                                OrderCategoryDto.builder().id("CRANE_OPERATION").label("Kranservice").build(),
                                OrderCategoryDto.builder().id("SCAFFOLDING").label("Gerüstbau").build(),
                                OrderCategoryDto.builder().id("CONFINED_SPACE").label("Behälterarbeiten").build(),
                                OrderCategoryDto.builder().id("HEIGHT_WORK").label("Höhenarbeiten").build(),
                                OrderCategoryDto.builder().id("SHUTDOWN_MAINTENANCE").label("Stillstandsarbeiten")
                                                .build(),
                                OrderCategoryDto.builder().id("OTHER").label("Sonstiges").build());

                return ResponseEntity.ok(categories);
        }

        /**
         * Gets company types (legal forms) for Germany.
         */
        @GetMapping("/company-types")
        public ResponseEntity<List<CompanyTypeDto>> getCompanyTypes() {
                log.debug("Fetching company types");

                List<CompanyTypeDto> types = List.of(
                                CompanyTypeDto.builder().value("einzelunternehmen").label("Einzelunternehmen").build(),
                                CompanyTypeDto.builder().value("gbr").label("GbR").build(),
                                CompanyTypeDto.builder().value("gmbh").label("GmbH").build(),
                                CompanyTypeDto.builder().value("ag").label("AG").build(),
                                CompanyTypeDto.builder().value("ug").label("UG (haftungsbeschränkt)").build(),
                                CompanyTypeDto.builder().value("ohg").label("OHG").build(),
                                CompanyTypeDto.builder().value("kg").label("KG").build(),
                                CompanyTypeDto.builder().value("gmbh_co_kg").label("GmbH & Co. KG").build(),
                                CompanyTypeDto.builder().value("other").label("Sonstige").build());

                return ResponseEntity.ok(types);
        }

        // DTOs for the public API responses

        @Data
        @Builder
        public static class SpecializationCategoryDto {
                private String id;
                private String name;
                private List<SpecializationDto> subCategories;
        }

        @Data
        @Builder
        public static class SpecializationDto {
                private String id;
                private String name;
                private List<SpecializationDto> subCategories;
        }

        @Data
        @Builder
        public static class IndustryCategoryDto {
                private String id;
                private String label;
                private List<IndustryDto> subCategories;
        }

        @Data
        @Builder
        public static class IndustryDto {
                private String id;
                private String label;
                private List<IndustryDto> subCategories;
        }

        @Data
        @Builder
        public static class OrderCategoryDto {
                private String id;
                private String label;
        }

        @Data
        @Builder
        public static class CompanyTypeDto {
                private String value;
                private String label;
        }
}