// OfficeUpdateDTO.java
package site.tmpphutech.UrbanVN.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OfficeUpdateDTO {
    @NotBlank(message = "オフィス名を入力してください。")
    private String name;

    private String address;
}

