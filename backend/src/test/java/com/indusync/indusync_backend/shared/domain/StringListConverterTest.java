package com.indusync.indusync_backend.shared.domain;

import com.indusync.indusync_backend.shared.domain.converter.StringListConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for StringListConverter.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@DisplayName("StringListConverter Tests")
class StringListConverterTest {

    private StringListConverter converter;

    @BeforeEach
    void setUp() {
        converter = new StringListConverter();
    }

    @Test
    @DisplayName("Should convert empty list to null")
    void shouldConvertEmptyListToNull() {
        List<String> emptyList = new ArrayList<>();
        String result = converter.convertToDatabaseColumn(emptyList);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should convert null list to null")
    void shouldConvertNullListToNull() {
        String result = converter.convertToDatabaseColumn(null);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should convert list to JSON string")
    void shouldConvertListToJsonString() {
        List<String> list = Arrays.asList("elektrotechnik", "programmierung", "sps");
        String result = converter.convertToDatabaseColumn(list);
        
        assertThat(result).isNotNull();
        assertThat(result).contains("elektrotechnik");
        assertThat(result).contains("programmierung");
        assertThat(result).contains("sps");
        assertThat(result).startsWith("[");
        assertThat(result).endsWith("]");
    }

    @Test
    @DisplayName("Should convert null JSON string to empty list")
    void shouldConvertNullJsonStringToEmptyList() {
        List<String> result = converter.convertToEntityAttribute(null);
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should convert empty JSON string to empty list")
    void shouldConvertEmptyJsonStringToEmptyList() {
        List<String> result = converter.convertToEntityAttribute("");
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should convert JSON string to list")
    void shouldConvertJsonStringToList() {
        String json = "[\"elektrotechnik\",\"programmierung\",\"sps\"]";
        List<String> result = converter.convertToEntityAttribute(json);
        
        assertThat(result).isNotNull();
        assertThat(result).hasSize(3);
        assertThat(result).containsExactly("elektrotechnik", "programmierung", "sps");
    }

    @Test
    @DisplayName("Should handle malformed JSON gracefully")
    void shouldHandleMalformedJsonGracefully() {
        String malformedJson = "invalid json";
        List<String> result = converter.convertToEntityAttribute(malformedJson);
        
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should handle round-trip conversion correctly")
    void shouldHandleRoundTripConversionCorrectly() {
        List<String> originalList = Arrays.asList("mechanical", "electrical", "software");
        
        String json = converter.convertToDatabaseColumn(originalList);
        List<String> convertedList = converter.convertToEntityAttribute(json);
        
        assertThat(convertedList).isEqualTo(originalList);
    }

    @Test
    @DisplayName("Should handle special characters in strings")
    void shouldHandleSpecialCharactersInStrings() {
        List<String> listWithSpecialChars = Arrays.asList("München", "Björn's Company", "Test & Co.");
        
        String json = converter.convertToDatabaseColumn(listWithSpecialChars);
        List<String> result = converter.convertToEntityAttribute(json);
        
        assertThat(result).isEqualTo(listWithSpecialChars);
    }
} 