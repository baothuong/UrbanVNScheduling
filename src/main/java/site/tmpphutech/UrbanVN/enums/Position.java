package site.tmpphutech.UrbanVN.enums;

public enum Position {
    MANAGER("Quản lý", "部長"),
    LEADER("Trưởng nhóm", "リーダー"),
    STAFF("Nhân viên", "一般社員");

    private final String vietnameseName;
    private final String japaneseName;

    Position(String vietnameseName, String japaneseName) {
        this.vietnameseName = vietnameseName;
        this.japaneseName = japaneseName;
    }

    public String getVietnameseName() {
        return vietnameseName;
    }

    public String getJapaneseName() {
        return japaneseName;
    }
}
