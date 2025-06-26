package site.tmpphutech.UrbanVN.dto;

import site.tmpphutech.UrbanVN.enums.ScheduleStatus;
import site.tmpphutech.UrbanVN.enums.WorkType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long officeId;
    private String officeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private WorkType workType;
    private String notes;
    private ScheduleStatus status;

}

