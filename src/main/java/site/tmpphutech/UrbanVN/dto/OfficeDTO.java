// OfficeDTO.java
package site.tmpphutech.UrbanVN.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OfficeDTO {
    private Long id;
    private String name;
    private String address;
    @JsonProperty("isActive") // <-- THÊM ANNOTATION NÀY
    private boolean isActive;
    private int employeeCount; // <-- Thêm dòng này

}

