package site.tmpphutech.UrbanVN.service;

import site.tmpphutech.UrbanVN.dto.ScheduleCreateDTO;
import site.tmpphutech.UrbanVN.dto.ScheduleDTO;
import site.tmpphutech.UrbanVN.dto.ScheduleUpdateDTO;
import site.tmpphutech.UrbanVN.enums.WorkType;
import site.tmpphutech.UrbanVN.exception.ResourceNotFoundException;
import site.tmpphutech.UrbanVN.exception.InvalidScheduleException;
import site.tmpphutech.UrbanVN.model.Employee;
import site.tmpphutech.UrbanVN.model.Office;
import site.tmpphutech.UrbanVN.model.Schedule;
import site.tmpphutech.UrbanVN.repository.EmployeeRepository;
import site.tmpphutech.UrbanVN.repository.OfficeRepository;
import site.tmpphutech.UrbanVN.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final OfficeRepository officeRepository;

    public ScheduleDTO createSchedule(ScheduleCreateDTO createDTO) {
        // <<< THAY ĐỔI / THÊM MỚI >>>
        validateScheduleLogic(
                createDTO.getEmployeeId(),
                createDTO.getStartDate(),
                createDTO.getEndDate(),
                createDTO.getStartTime(),
                createDTO.getEndTime(),
                createDTO.getWorkType(),
                0L // ID mặc định cho lịch mới
        );

        Employee employee = employeeRepository.findById(createDTO.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + createDTO.getEmployeeId()));

        Office office = officeRepository.findById(createDTO.getOfficeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy văn phòng với ID: " + createDTO.getOfficeId()));

        Schedule schedule = new Schedule();
        schedule.setEmployee(employee);
        schedule.setOffice(office);
        schedule.setStartDate(createDTO.getStartDate());
        schedule.setEndDate(createDTO.getEndDate());
        schedule.setStartTime(createDTO.getStartTime());
        schedule.setEndTime(createDTO.getEndTime());
        schedule.setWorkType(createDTO.getWorkType());
        schedule.setNotes(createDTO.getNotes());

        Schedule savedSchedule = scheduleRepository.save(schedule);
        return convertToDTO(savedSchedule);
    }

    public ScheduleDTO updateSchedule(Long id, ScheduleUpdateDTO updateDTO) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch làm việc với ID: " + id));

        // <<< THAY ĐỔI / THÊM MỚI >>>
        // Lấy thông tin mới hoặc giữ lại thông tin cũ nếu không được cung cấp
        LocalDate newStartDate = (updateDTO.getStartDate() != null) ? updateDTO.getStartDate() : schedule.getStartDate();
        LocalDate newEndDate = (updateDTO.getEndDate() != null) ? updateDTO.getEndDate() : schedule.getEndDate();
        WorkType newWorkType = (updateDTO.getWorkType() != null) ? updateDTO.getWorkType() : schedule.getWorkType();
        LocalTime newStartTime = (updateDTO.getStartTime() != null) ? updateDTO.getStartTime() : schedule.getStartTime();
        LocalTime newEndTime = (updateDTO.getEndTime() != null) ? updateDTO.getEndTime() : schedule.getEndTime();
        Long newEmployeeId = (updateDTO.getEmployeeId() != null) ? updateDTO.getEmployeeId() : schedule.getEmployee().getId();

        // Nếu loại công việc là nghỉ phép hoặc công tác, ép giờ về null
        if (newWorkType == WorkType.VACATION || newWorkType == WorkType.BUSINESS_TRIP) {
            newStartTime = null;
            newEndTime = null;
        }

        // Thực hiện tất cả các kiểm tra nghiệp vụ
        validateScheduleLogic(
                newEmployeeId,
                newStartDate,
                newEndDate,
                newStartTime,
                newEndTime,
                newWorkType,
                id // ID để loại trừ chính lịch đang được sửa
        );

        // Cập nhật thông tin
        schedule.setStartDate(newStartDate);
        schedule.setEndDate(newEndDate);
        schedule.setStartTime(newStartTime);
        schedule.setEndTime(newEndTime);
        schedule.setWorkType(newWorkType);

        if (updateDTO.getOfficeId() != null) {
            Office office = officeRepository.findById(updateDTO.getOfficeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy văn phòng với ID: " + updateDTO.getOfficeId()));
            schedule.setOffice(office);
        }
        if (updateDTO.getNotes() != null) {
            schedule.setNotes(updateDTO.getNotes());
        }
        if (updateDTO.getEmployeeId() != null && !updateDTO.getEmployeeId().equals(schedule.getEmployee().getId())) {
            Employee newEmployee = employeeRepository.findById(updateDTO.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên mới với ID: " + updateDTO.getEmployeeId()));
            schedule.getEmployee().getSchedules().remove(schedule);
            schedule.setEmployee(newEmployee);
            newEmployee.getSchedules().add(schedule);
        }

        Schedule savedSchedule = scheduleRepository.save(schedule);
        return convertToDTO(savedSchedule);
    }

    /**
     * <<< THAY ĐỔI / THÊM MỚI >>>
     * Logic xác thực lịch trình được viết lại hoàn toàn.
     */
    private void validateScheduleLogic(Long employeeId, LocalDate startDate, LocalDate endDate, LocalTime startTime, LocalTime endTime, WorkType workType, Long scheduleIdToExclude) {
        // --- CÁC KIỂM TRA CƠ BẢN ---
        if (endDate.isBefore(startDate)) {
            throw new InvalidScheduleException("Ngày kết thúc không thể trước ngày bắt đầu.");
        }

        // --- XỬ LÝ THEO LOẠI CÔNG VIỆC ---
        switch (workType) {
            case NORMAL:
            case OUTSIDE:
            case OVERTIME:
                // Các loại công việc CÓ GIỜ CỤ THỂ
                if (startTime == null || endTime == null) {
                    throw new InvalidScheduleException("Với loại công việc này, giờ bắt đầu và kết thúc là bắt buộc.");
                }
                if (!startDate.isEqual(endDate)) {
                    throw new InvalidScheduleException("Loại công việc này chỉ có thể diễn ra trong một ngày.");
                }
                if (!endTime.isAfter(startTime)) {
                    throw new InvalidScheduleException("Giờ kết thúc phải sau giờ bắt đầu.");
                }

                // Kiểm tra xung đột với các lịch trình CÓ GIỜ khác trong cùng ngày
                List<Schedule> overlappingTimeSchedules = scheduleRepository.findOverlappingSchedules(
                        employeeId, startDate, startTime, endTime, scheduleIdToExclude);
                if (!overlappingTimeSchedules.isEmpty()) {
                    throw new InvalidScheduleException("Lịch trình bị chồng chéo thời gian với một lịch trình khác trong ngày.");
                }

                // Kiểm tra xung đột với các lịch trình CẢ NGÀY (Nghỉ phép/Công tác)
                List<Schedule> conflictingAllDaySchedules = scheduleRepository.findAnyScheduleInDateRange(
                        employeeId, startDate, endDate, scheduleIdToExclude);

                // Lọc ra các sự kiện là VACATION hoặc BUSINESS_TRIP
                boolean hasConflictWithAllDayEvent = conflictingAllDaySchedules.stream()
                        .anyMatch(s -> s.getWorkType() == WorkType.VACATION || s.getWorkType() == WorkType.BUSINESS_TRIP);

                if(hasConflictWithAllDayEvent) {
                    throw new InvalidScheduleException("Không thể tạo lịch làm việc trong ngày nhân viên đang nghỉ phép hoặc đi công tác.");
                }
                break;

            case VACATION:
            case BUSINESS_TRIP:
                // Các loại công việc CẢ NGÀY
                if (startTime != null || endTime != null) {
                    throw new InvalidScheduleException("Nghỉ phép và công tác là sự kiện cả ngày, không cần giờ cụ thể.");
                }

                // Kiểm tra xem có bất kỳ lịch trình nào khác (có giờ hoặc cả ngày) tồn tại trong khoảng thời gian này không
                List<Schedule> anyExistingSchedules = scheduleRepository.findAnyScheduleInDateRange(
                        employeeId, startDate, endDate, scheduleIdToExclude);
                if (!anyExistingSchedules.isEmpty()) {
                    throw new InvalidScheduleException("Lịch nghỉ phép/công tác bị xung đột với một lịch trình đã tồn tại.");
                }
                break;
        }
    }

    public List<ScheduleDTO> getSchedulesByDateRange(LocalDate filterStartDate, LocalDate filterEndDate, Long officeId, WorkType workType) {
        List<Schedule> schedules = scheduleRepository.findSchedulesByDateRangeAndFilters(filterStartDate, filterEndDate, officeId, workType);
        return schedules.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<ScheduleDTO> getSchedulesByEmployee(Long employeeId, LocalDate startDate, LocalDate endDate) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId);
        }
        List<Schedule> schedules = scheduleRepository.findSchedulesForEmployeeInDateRange(employeeId, startDate, endDate);
        return schedules.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public ScheduleDTO getScheduleById(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch làm việc với ID: " + id));
        return convertToDTO(schedule);
    }

    public void deleteSchedule(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy lịch làm việc với ID: " + id);
        }
        scheduleRepository.deleteById(id);
    }

    private ScheduleDTO convertToDTO(Schedule schedule) {
        ScheduleDTO dto = new ScheduleDTO();
        dto.setId(schedule.getId());
        dto.setEmployeeId(schedule.getEmployee().getId());
        dto.setEmployeeName(schedule.getEmployee().getName());
        if (schedule.getOffice() != null) {
            dto.setOfficeId(schedule.getOffice().getId());
            dto.setOfficeName(schedule.getOffice().getName());
        }
        dto.setStartDate(schedule.getStartDate());
        dto.setEndDate(schedule.getEndDate());
        dto.setStartTime(schedule.getStartTime());
        dto.setEndTime(schedule.getEndTime());
        dto.setWorkType(schedule.getWorkType());
        dto.setNotes(schedule.getNotes());
        return dto;
    }
}