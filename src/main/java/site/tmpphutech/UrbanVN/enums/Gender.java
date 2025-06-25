package site.tmpphutech.UrbanVN.enums;

public enum Gender {
    MALE("Nam", "男性"),
    FEMALE("Nữ", "女性"),
    OTHER("Khác", "その他");

    private final String vietnameseName;
    private final String japaneseName;

    Gender(String vietnameseName, String japaneseName) {
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
