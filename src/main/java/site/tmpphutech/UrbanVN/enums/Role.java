package site.tmpphutech.UrbanVN.enums;
import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ADMIN("Quản trị viên", "管理者"),
    MANAGER("Quản lý", "マネージャー"),
    USER("Người dùng", "ユーザー");

    private final String vietnameseName;
    private final String japaneseName;

    Role(String vietnameseName, String japaneseName) {
        this.vietnameseName = vietnameseName;
        this.japaneseName = japaneseName;
    }

    public String getVietnameseName() {
        return vietnameseName;
    }

    public String getJapaneseName() {
        return japaneseName;
    }

    @Override
    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
