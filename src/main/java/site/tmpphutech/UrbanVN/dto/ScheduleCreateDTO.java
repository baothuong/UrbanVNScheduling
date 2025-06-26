package site.tmpphutech.UrbanVN.dto;

import site.tmpphutech.UrbanVN.enums.WorkType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleCreateDTO {
    @NotNull(message = "従業員IDは空欄にできません")
    private Long employeeId;

    @NotNull(message = "オフィスを空のままにすることはできません")
    private Long officeId;

    @NotNull(message = "営業日は空白のままにできません")
    private LocalDate startDate;
    @NotNull(message = "営業日は空白のままにできません")
    private LocalDate endDate;

    private LocalTime startTime;
    private LocalTime endTime;

    @NotNull(message = "求人種別は空白のままにできません")
    private WorkType workType;

    private String notes;
}

