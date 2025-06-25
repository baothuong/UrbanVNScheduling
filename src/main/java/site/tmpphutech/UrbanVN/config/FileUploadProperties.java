// FileUploadProperties.java
package site.tmpphutech.UrbanVN.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "file.upload")
public class FileUploadProperties {
    private String dir = "uploads/avatars/";
    private long maxSize = 5242880; // 5MB
    private String allowedTypes = "jpg,jpeg,png,gif";
}

