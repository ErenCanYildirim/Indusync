package com.indusync.indusync_backend.company.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for TermsConditionsDocument entity.
 * Tests the entity creation, validation, and business methods.
 */
class TermsConditionsDocumentTest {

    private UUID companyId;
    private String fileName;
    private String originalFileName;
    private Long fileSize;
    private String mimeType;
    private String fileUrl;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        fileName = "terms_conditions_123.pdf";
        originalFileName = "Terms and Conditions.pdf";
        fileSize = 1024000L; // 1MB
        mimeType = "application/pdf";
        fileUrl = "https://storage.example.com/documents/terms_conditions_123.pdf";
    }

    @Test
    void constructor_ShouldCreateValidDocument_WhenValidParametersProvided() {
        // When
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, originalFileName, fileSize, mimeType, fileUrl);

        // Then
        assertNotNull(document);
        assertEquals(companyId, document.getCompanyId());
        assertEquals(fileName, document.getFileName());
        assertEquals(originalFileName, document.getOriginalFileName());
        assertEquals(fileSize, document.getFileSize());
        assertEquals(mimeType, document.getMimeType());
        assertEquals(fileUrl, document.getFileUrl());
        assertEquals(Integer.valueOf(1), document.getDocumentVersion());
        assertTrue(document.isActive());
        assertNull(document.getChecksum());
    }

    @Test
    void setCompanyId_ShouldThrowException_WhenCompanyIdIsNull() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> document.setCompanyId(null));
    }

    @Test
    void setFileName_ShouldThrowException_WhenFileNameIsNullOrEmpty() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> document.setFileName(null));
        assertThrows(IllegalArgumentException.class, () -> document.setFileName(""));
        assertThrows(IllegalArgumentException.class, () -> document.setFileName("   "));
    }

    @Test
    void setFileSize_ShouldThrowException_WhenFileSizeIsInvalid() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> document.setFileSize(null));
        assertThrows(IllegalArgumentException.class, () -> document.setFileSize(0L));
        assertThrows(IllegalArgumentException.class, () -> document.setFileSize(-1L));
        assertThrows(IllegalArgumentException.class, () -> document.setFileSize(10485761L)); // > 10MB
    }

    @Test
    void setMimeType_ShouldThrowException_WhenMimeTypeIsNotPdf() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> document.setMimeType(null));
        assertThrows(IllegalArgumentException.class, () -> document.setMimeType(""));
        assertThrows(IllegalArgumentException.class, () -> document.setMimeType("text/plain"));
        assertThrows(IllegalArgumentException.class, () -> document.setMimeType("image/jpeg"));

        // Should not throw for valid PDF mime type
        assertDoesNotThrow(() -> document.setMimeType("application/pdf"));
    }

    @Test
    void setDocumentVersion_ShouldThrowException_WhenVersionIsInvalid() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> document.setDocumentVersion(null));
        assertThrows(IllegalArgumentException.class, () -> document.setDocumentVersion(0));
        assertThrows(IllegalArgumentException.class, () -> document.setDocumentVersion(-1));

        // Should not throw for valid version
        assertDoesNotThrow(() -> document.setDocumentVersion(1));
        assertDoesNotThrow(() -> document.setDocumentVersion(5));
    }

    @Test
    void deactivate_ShouldSetIsActiveToFalse() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, originalFileName, fileSize, mimeType, fileUrl);
        assertTrue(document.isActive());

        // When
        document.deactivate();

        // Then
        assertFalse(document.isActive());
    }

    @Test
    void activate_ShouldSetIsActiveToTrue() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, originalFileName, fileSize, mimeType, fileUrl);
        document.deactivate();
        assertFalse(document.isActive());

        // When
        document.activate();

        // Then
        assertTrue(document.isActive());
    }

    @Test
    void getFormattedFileSize_ShouldReturnFormattedString() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, originalFileName, 1536L, mimeType, fileUrl); // 1.5 KB

        // When
        String formattedSize = document.getFormattedFileSize();

        // Then
        assertEquals("1.5 KB", formattedSize);
    }

    @Test
    void hasValidFileExtension_ShouldReturnTrue_WhenFileNameEndsWith_pdf() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, "document.pdf", fileSize, mimeType, fileUrl);

        // When & Then
        assertTrue(document.hasValidFileExtension());
    }

    @Test
    void hasValidFileExtension_ShouldReturnFalse_WhenFileNameDoesNotEndWith_pdf() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, "document.txt", fileSize, mimeType, fileUrl);

        // When & Then
        assertFalse(document.hasValidFileExtension());
    }

    @Test
    void createNewVersion_ShouldCreateNewVersionAndDeactivateCurrent() {
        // Given
        TermsConditionsDocument currentDocument = new TermsConditionsDocument(
                companyId, fileName, originalFileName, fileSize, mimeType, fileUrl);
        currentDocument.setDocumentVersion(2);
        assertTrue(currentDocument.isActive());

        String newFileName = "new_terms_conditions.pdf";
        String newOriginalFileName = "New Terms and Conditions.pdf";
        Long newFileSize = 2048000L;
        String newFileUrl = "https://storage.example.com/documents/new_terms_conditions.pdf";
        String newChecksum = "abc123def456";

        // When
        TermsConditionsDocument newVersion = currentDocument.createNewVersion(
                newFileName, newOriginalFileName, newFileSize, newFileUrl, newChecksum);

        // Then
        assertNotNull(newVersion);
        assertEquals(companyId, newVersion.getCompanyId());
        assertEquals(newFileName, newVersion.getFileName());
        assertEquals(newOriginalFileName, newVersion.getOriginalFileName());
        assertEquals(newFileSize, newVersion.getFileSize());
        assertEquals(newFileUrl, newVersion.getFileUrl());
        assertEquals(newChecksum, newVersion.getChecksum());
        assertEquals(Integer.valueOf(3), newVersion.getDocumentVersion()); // Incremented
        assertTrue(newVersion.isActive());

        // Current document should be deactivated
        assertFalse(currentDocument.isActive());
    }

    @Test
    void toString_ShouldReturnFormattedString() {
        // Given
        TermsConditionsDocument document = new TermsConditionsDocument(
                companyId, fileName, originalFileName, fileSize, mimeType, fileUrl);

        // When
        String result = document.toString();

        // Then
        assertTrue(result.contains("TermsConditionsDocument"));
        assertTrue(result.contains(companyId.toString()));
        assertTrue(result.contains(fileName));
        assertTrue(result.contains("documentVersion=1"));
        assertTrue(result.contains("isActive=true"));
    }
}