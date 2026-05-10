package com.indusync.indusync_backend.shared.infrastructure;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService implements FileStorageService {
    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(MultipartFile MultipartFile, String folder, String publicId) {
        try {
            byte[] bytes = multipartFile.getBytes();
            Map<?, ?> uploadResult = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                "folder", folder,
                "public_id", publicId
            ));
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage());
        }
    }
}