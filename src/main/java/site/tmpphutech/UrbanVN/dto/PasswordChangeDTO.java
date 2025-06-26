package site.tmpphutech.UrbanVN.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordChangeDTO {
    @NotBlank(message = "現在のパスワードは空白にできません")
    private String currentPassword;

    @NotBlank(message = "新しいパスワードは空白にできません")
    @Size(min = 6, message = "新しいパスワードは6文字以上でなければなりません")
    @Pattern(regexp = "^\\S*$", message = "新しいパスワードにはスペースを含めることはできません")
    private String newPassword;

    @NotBlank(message = "パスワードの確認は空欄にできません")
    private String confirmPassword;
}

