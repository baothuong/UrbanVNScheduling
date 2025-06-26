package site.tmpphutech.UrbanVN.dto;

import site.tmpphutech.UrbanVN.enums.Gender;
import site.tmpphutech.UrbanVN.enums.Position;
import site.tmpphutech.UrbanVN.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class EmployeeUpdateDTO {
    @NotBlank (message = "氏名を入力してください。")
    private String name;

    @NotBlank(message = "ユーザー名を入力してください。")
    @Pattern(regexp = "^\\S*$", message = "ユーザー名に空白文字は使用できません。")
    private String username;

    @Email(message = "メールアドレスの形式が正しくありません。")
    @NotBlank(message = "メールアドレスを入力してください。")
    @Pattern(regexp = "^\\S*$", message = "メールアドレスに空白文字は使用できません。")
    private String email;

    private String phoneNumber;
    private Gender gender;
    private String address;

    @NotNull(message = "役職を選択してください。")
    private Position position;

    @NotNull(message = "オフィスを選択してください。")
    private Long officeId;

    private String avatar;
    private Role role;

    @Pattern(regexp = "^\\S*$", message = "パスワードに空白文字は使用できません。")
    private String password;
}