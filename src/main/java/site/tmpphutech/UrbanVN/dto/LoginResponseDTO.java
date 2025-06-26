// LoginResponseDTO.java
package site.tmpphutech.UrbanVN.dto;

import site.tmpphutech.UrbanVN.enums.Role;
import lombok.Data;

@Data
public class LoginResponseDTO {
    private String message;
    private EmployeeDTO employee;
    private String sessionId;
}

