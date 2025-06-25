// ScheduleUpdateDTO.java
package site.tmpphutech.UrbanVN.dto;

import site.tmpphutech.UrbanVN.enums.WorkType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleUpdateDTO {
    private Long employeeId;
    private Long officeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private WorkType workType;
    private String notes;
}

