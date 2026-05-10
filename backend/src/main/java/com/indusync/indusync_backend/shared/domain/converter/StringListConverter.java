package com.indusync.indusync_backend.shared.domain.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA AttributeConverter for converting between List<String> and JSON string.
 * <p>
 * This converter allows storing lists of strings as JSON arrays in the database,
 * which is useful for fields like specializations, industries, order categories, etc.
 * </p>
 * 
 * Usage:
 * <pre>
 * {@code
 * @Convert(converter = StringListConverter.class)
 * @Column(name = "specializations", columnDefinition = "TEXT")
 * private List<String> specializations = new ArrayList<>();
 * }
 * </pre>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Converter
@Slf4j
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    /**
     * Converts a List<String> to JSON string for database storage.
     *
     * @param attribute the List<String> to convert
     * @return JSON string representation, or null if input is null/empty
     */
    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Error converting List<String> to JSON: {}", attribute, e);
            throw new RuntimeException("Error converting List<String> to JSON", e);
        }
    }

    /**
     * Converts a JSON string from database to List<String>.
     *
     * @param dbData the JSON string from database
     * @return List<String> representation, or empty list if input is null/empty
     */
    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return new ArrayList<>();
        }

        try {
            List<String> result = objectMapper.readValue(dbData, STRING_LIST_TYPE);
            return result != null ? result : new ArrayList<>();
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to List<String>: {}", dbData, e);
            // Return an empty list instead of throwing exception to handle corrupt data gracefully
            return new ArrayList<>();
        }
    }
} 