package com.indusync.indusync_backend.shared.taxonomy;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;


/**
 * Service providing access to the skill → category taxonomy as well as helper utilities
 * for proximity reasoning (same category, fuzzy match, etc.).
 */

@Service
@Slf4j
public class SkillTaxonomyService {
    
    private final Map<String, String> skillToCategory = new HashMap<>();
    private static final String TAXONOMY_RESOURCE = "taxonomy/specializations.json";

    @PostConstruct
    void init() {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(TAXONOMY_RESOURCE)) {
            if (is == null) {
                throw new IllegalStateException("Could not find taxonomy resource " + TAXONOMY_RESOURCE);
            }
            ObjectMapper mapper = new ObjectMapper();
            Map<String, List<String>> data = mapper.readValue(is, new TypeReference<>() {
            });
            data.forEach((category, skills) -> skills.forEach(skill -> skillToCategory.put(skill, category)));
            log.info("Loaded {} skills across {} categories into taxonomy", skillToCategory.size(), data.size());
        } catch (IOException e) {
            throw new RuntimeException("Failed to load skill taxonomy", e);
        }
    }

    /**
     * Returns the category id for a given skill id, if present.
     */
    public Optional<String> getCategoryForSkill(String skillId) {
        if (skillId == null) return Optional.empty();
        return Optional.ofNullable(skillToCategory.get(skillId.toLowerCase()));
    }

    **
     * Checks whether two skill IDs belong to the same category.
     */
    public boolean inSameCategory(String skillA, String skillB) {
        if (skillA == null || skillB == null) return false;
        return getCategoryForSkill(skillA)
                .flatMap(catA -> getCategoryForSkill(skillB).filter(catA::equals))
                .isPresent();
    }

    /**
     * Basic fuzzy lookup: returns true if skillB shares a common prefix of length ≥4 with skillA.
     * TODO(Optional): replace with pg_trgm similarity once DB extension is enabled.
     */
    public boolean fuzzySimilar(String requiredSkill, String providerSkill) {
        if (requiredSkill == null || providerSkill == null) return false;
        String a = requiredSkill.toLowerCase();
        String b = providerSkill.toLowerCase();
        int minPrefix = 4;
        return a.length() >= minPrefix && b.length() >= minPrefix && a.substring(0, minPrefix).equals(b.substring(0, minPrefix));
    }
}