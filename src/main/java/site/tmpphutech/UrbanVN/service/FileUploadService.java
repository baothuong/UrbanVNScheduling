// FileUploadService.java
package site.tmpphutech.UrbanVN.service;

import site.tmpphutech.UrbanVN.config.FileUploadProperties;
import site.tmpphutech.UrbanVN.exception.FileUploadException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final FileUploadProperties fileUploadProperties;

    public String uploadAvatar(MultipartFile file) {
        validateFile(file);

        try {
            // Tạo thư mục nếu chưa tồn tại
            Path uploadPath = Paths.get(fileUploadProperties.getDir());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Tạo tên file unique
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String newFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Lưu file
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File uploaded successfully: {}", newFilename);
            return newFilename;

        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage());
            throw new FileUploadException("Không thể upload file: " + e.getMessage());
        }
    }

    public void deleteAvatar(String filename) {
        if (filename == null || filename.isEmpty()) {
            return;
        }

        try {
            Path filePath = Paths.get(fileUploadProperties.getDir()).resolve(filename);
            Files.deleteIfExists(filePath);
            log.info("File deleted successfully: {}", filename);
        } catch (IOException e) {
            log.error("Error deleting file: {}", e.getMessage());
        }
    }

    public byte[] getAvatar(String filename) {
        try {
            Path filePath = Paths.get(fileUploadProperties.getDir()).resolve(filename);
            if (Files.exists(filePath)) {
                return Files.readAllBytes(filePath);
            }
            return null;
        } catch (IOException e) {
            log.error("Error reading file: {}", e.getMessage());
            return null;
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileUploadException("File không được để trống");
        }

        if (file.getSize() > fileUploadProperties.getMaxSize()) {
            throw new FileUploadException("File quá lớn. Kích thước tối đa: " +
                    (fileUploadProperties.getMaxSize() / 1024 / 1024) + "MB");
        }

        String fileExtension = getFileExtension(file.getOriginalFilename());
        String[] allowedTypes = fileUploadProperties.getAllowedTypes().split(",");

        if (!Arrays.asList(allowedTypes).contains(fileExtension.toLowerCase())) {
            throw new FileUploadException("Định dạng file không được hỗ trợ. Chỉ chấp nhận: " +
                    String.join(", ", allowedTypes));
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex >= 0 ? filename.substring(lastDotIndex + 1) : "";
    }
}

