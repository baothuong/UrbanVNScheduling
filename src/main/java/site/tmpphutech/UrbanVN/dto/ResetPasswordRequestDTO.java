package site.tmpphutech.UrbanVN.dto;

import lombok.Data;

@Data
public class ResetPasswordRequestDTO {
    private String token;
    private  String password;
    private  String comfirmPass;
}
