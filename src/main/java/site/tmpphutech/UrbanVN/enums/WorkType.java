package site.tmpphutech.UrbanVN.enums;

public enum WorkType {
    NORMAL("Làm việc", "通常勤務", "#3B82F6"),      // Xanh dương
    BUSINESS_TRIP("Công tác", "出張", "#F59E0B"),              // Cam
    VACATION("Nghỉ phép", "有給休暇", "#10B981"),              // Xanh lá
    OUTSIDE("Ra ngoài", "外出", "#8B5CF6"),                    // Tím
    OVERTIME("Tăng ca", "残業", "#EF4444");               // Đỏ

    private final String vietnameseName;
    private final String japaneseName;
    private final String color; // Màu hiển thị trên calendar

    WorkType(String vietnameseName, String japaneseName, String color) {
        this.vietnameseName = vietnameseName;
        this.japaneseName = japaneseName;
        this.color = color;
    }

    public String getVietnameseName() {
        return vietnameseName;
    }

    public String getJapaneseName() {
        return japaneseName;
    }

    public String getColor() {
        return color;
    }
}
