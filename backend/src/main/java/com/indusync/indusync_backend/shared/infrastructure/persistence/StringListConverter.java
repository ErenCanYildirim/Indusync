package com.indusync.indusync_backend.shared.infrastructure.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA converter for storing List&lt;String&gt; as JSON in database TEXT
 * columns.
 * <p>
 * This converter handles the serialization and deserialization of string lists
 * to/from JSON format for database storage. It's particularly useful for:
 * - Specializations arrays
 * - Industries arrays
 * - Order categories arrays
 * - User interests
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final Logger log = LoggerFactory.getLogger(StringListConverter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE_REF = new TypeReference<>() {
    };

    /**
     * Converts a List&lt;String&gt; to JSON string for database storage.
     *
     * @param attribute the list to convert (can be null or empty)
     * @return JSON string representation, or null if input is null/empty
     */
    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }

        try {
            String json = objectMapper.writeValueAsString(attribute);
            log.debug("Converting list to JSON: {} -> {}", attribute, json);
            return json;
        } catch (JsonProcessingException e) {
            log.error("Error converting list to JSON: {}", attribute, e);
            throw new RuntimeException("Failed to convert list to JSON", e);
        }
    }

    /**
     * Converts JSON string from database back to List&lt;String&gt;.
     *
     * @param dbData the JSON string from database (can be null or empty)
     * @return List&lt;String&gt; representation, or empty list if input is
     *         null/empty
     */
    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return new ArrayList<>();
        }

        try {
            List<String> list = objectMapper.readValue(dbData, STRING_LIST_TYPE_REF);
            log.debug("Converting JSON to list: {} -> {}", dbData, list);
            return list != null ? list : new ArrayList<>();
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to list: {}", dbData, e);
            // Return empty list instead of throwing exception to handle legacy data
            log.warn("Returning empty list due to JSON parsing error for data: {}", dbData);
            return new ArrayList<>();
        }
    }

    /**
     * Validates that a list contains only non-null, non-blank strings.
     *
     * @param list the list to validate
     * @return true if all strings are valid
     */
    public static boolean isValidStringList(List<String> list) {
        if (list == null) {
            return true; // null is considered valid
        }

        return list.stream()
                .allMatch(item -> item != null && !item.trim().isEmpty());
    }

    /**
     * Cleans a string list by removing null, empty, and whitespace-only strings.
     *
     * @param list the list to clean
     * @return cleaned list with only valid strings
     */
    public static List<String> cleanStringList(List<String> list) {
        if (list == null) {
            return new ArrayList<>();
        }

        return list.stream()
                .filter(item -> item != null && !item.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .toList();
    }

    /**
     * Normalizes a string list for consistent storage.
     * - Trims whitespace
     * - Removes empty strings
     * - Removes duplicates
     * - Converts to lowercase for case-insensitive comparison
     *
     * @param list the list to normalize
     * @return normalized list
     */
    public static List<String> normalizeStringList(List<String> list) {
        if (list == null) {
            return new ArrayList<>();
        }

        return list.stream()
                .filter(item -> item != null && !item.trim().isEmpty())
                .map(item -> item.trim().toLowerCase())
                .distinct()
                .sorted() // Sort for consistent ordering
                .toList();
    }

    /**
     * Creates a mutable copy of a string list.
     * Useful when you need to modify the list after conversion.
     *
     * @param list the source list
     * @return mutable ArrayList copy
     */
    public static List<String> toMutableList(List<String> list) {
        return list != null ? new ArrayList<>(list) : new ArrayList<>();
    }

    /**
     * Checks if two string lists are equivalent (ignoring order and case).
     *
     * @param list1 first list
     * @param list2 second list
     * @return true if lists contain the same elements (case-insensitive)
     */
    public static boolean areEquivalent(List<String> list1, List<String> list2) {
        if (list1 == list2)
            return true;
        if (list1 == null || list2 == null)
            return false;

        List<String> normalized1 = normalizeStringList(list1);
        List<String> normalized2 = normalizeStringList(list2);

        return normalized1.equals(normalized2);
    }

    /**
     * Merges multiple string lists into one, removing duplicates.
     *
     * @param lists the lists to merge
     * @return merged list with unique values
     */
    @SafeVarargs
    public static List<String> mergeLists(List<String>... lists) {
        List<String> merged = new ArrayList<>();

        for (List<String> list : lists) {
            if (list != null) {
                merged.addAll(list);
            }
        }

        return cleanStringList(merged);
    }

    /**
     * Adds items to a list if they don't already exist (case-insensitive).
     *
     * @param list  the target list (will be modified)
     * @param items the items to add
     */
    public static void addUniqueItems(List<String> list, String... items) {
        if (list == null || items == null)
            return;

        for (String item : items) {
            if (item != null && !item.trim().isEmpty()) {
                String trimmedItem = item.trim();
                boolean exists = list.stream()
                        .anyMatch(existing -> existing.equalsIgnoreCase(trimmedItem));

                if (!exists) {
                    list.add(trimmedItem);
                }
            }
        }
    }
}