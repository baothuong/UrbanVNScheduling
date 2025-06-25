// OfficeCreateDTO.java
package site.tmpphutech.UrbanVN.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OfficeCreateDTO {
    @NotBlank(message = "Tên văn phòng không được để trống")
    private String name;

    private String address;
}

