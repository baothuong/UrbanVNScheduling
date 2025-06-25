// LoginResponseDTO.java
package site.tmpphutech.UrbanVN.dto;

import lombok.Data;

@Data
public class LoginResponseDTO {
    private String message;
    private EmployeeDTO employee;
    private String sessionId;
}

