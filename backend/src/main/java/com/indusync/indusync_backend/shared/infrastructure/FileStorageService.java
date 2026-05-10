package com.indusync.indusync_backend.shared.infrastructure;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String uploadFile(MultipartFile multipartFile, String folder, String publicId);
    void deleteFile(String publicId);
}