package site.tmpphutech.UrbanVN.dto;

import site.tmpphutech.UrbanVN.enums.Gender;
import site.tmpphutech.UrbanVN.enums.Position;
import site.tmpphutech.UrbanVN.enums.Role;
import lombok.Data;

@Data
public class EmployeeDTO {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String phoneNumber;
    private Gender gender;
    private String address;
    private Position position;
    private Long officeId;
    private String officeName;
    private String avatar;
    private Role role;


}

