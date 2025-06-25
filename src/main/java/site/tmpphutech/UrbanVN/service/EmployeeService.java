package site.tmpphutech.UrbanVN.service;

import site.tmpphutech.UrbanVN.dto.*;
import site.tmpphutech.UrbanVN.enums.Position;
import site.tmpphutech.UrbanVN.enums.Role;
import site.tmpphutech.UrbanVN.exception.ResourceNotFoundException;
import site.tmpphutech.UrbanVN.exception.DuplicateResourceException;
import site.tmpphutech.UrbanVN.model.Employee;
import site.tmpphutech.UrbanVN.model.Office;
import site.tmpphutech.UrbanVN.model.PasswordResetToken;
import site.tmpphutech.UrbanVN.repository.EmployeeRepository;
import site.tmpphutech.UrbanVN.repository.OfficeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final OfficeRepository officeRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileUploadService fileUploadService;
    private final AuthService authService;


    public Page<EmployeeDTO> getAllEmployees(Long officeId, Position position,String keyword, Pageable pageable) {
        Page<Employee> employees = employeeRepository.findByFilters(officeId, position,keyword, pageable);
        return employees.map(this::convertToDTO);
    }

    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));
        return convertToDTO(employee);
    }

    public EmployeeDTO findEmployeeByEmail(String email){
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với email: " + email));
        return convertToDTO(employee);
    }

    public EmployeeDTO createEmployee(EmployeeCreateDTO createDTO) {
        // Kiểm tra username và email đã tồn tại
        if (employeeRepository.existsByUsername(createDTO.getUsername())) {
            throw new DuplicateResourceException("Username đã tồn tại: " + createDTO.getUsername());
        }
        if (employeeRepository.existsByEmail(createDTO.getEmail())) {
            throw new DuplicateResourceException("Email đã tồn tại: " + createDTO.getEmail());
        }

        // Kiểm tra office tồn tại
        Office office = officeRepository.findById(createDTO.getOfficeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy văn phòng với ID: " + createDTO.getOfficeId()));

        Employee employee = new Employee();
        employee.setName(createDTO.getName());
        employee.setUsername(createDTO.getUsername());
        employee.setEmail(createDTO.getEmail());
        employee.setPassword(passwordEncoder.encode(createDTO.getPassword()));
        employee.setPhoneNumber(createDTO.getPhoneNumber());
        employee.setGender(createDTO.getGender());
        employee.setAddress(createDTO.getAddress());
        employee.setPosition(createDTO.getPosition());
        employee.setOffice(office);
        employee.setAvatar(createDTO.getAvatar());
        employee.setRole(createDTO.getRole());

        Employee savedEmployee = employeeRepository.save(employee);
        return convertToDTO(savedEmployee);
    }

    public EmployeeDTO updateEmployee(Long id, EmployeeUpdateDTO updateDTO) {
        // LOGIC KIỂM TRA QUYỀN
        Employee currentUser = authService.getCurrentUser();
        Employee employeeToUpdate = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        // Logic kiểm tra quyền được đặt bên trong khối này vì nó chỉ liên quan đến việc đổi mật khẩu
        if (updateDTO.getPassword() != null && !updateDTO.getPassword().isEmpty()) {
            // Kiểm tra quyền hạn trước khi cho đổi mật khẩu
            if (currentUser.getRole() == Role.MANAGER) {
                if ((employeeToUpdate.getRole() == Role.ADMIN || employeeToUpdate.getRole() == Role.MANAGER) && !currentUser.getId().equals(employeeToUpdate.getId())) {
                    throw new SecurityException("Manager không có quyền thay đổi mật khẩu của Admin hoặc Manager khác.");
                }
            }
            // Nếu là ADMIN, họ có toàn quyền, không cần kiểm tra thêm
            // Cập nhật và mã hóa mật khẩu mới
            employeeToUpdate.setPassword(passwordEncoder.encode(updateDTO.getPassword()));
        }


        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        // Kiểm tra email trùng (nếu thay đổi)
        if (!employee.getEmail().equals(updateDTO.getEmail()) &&
                employeeRepository.existsByEmail(updateDTO.getEmail())) {
            throw new DuplicateResourceException("Email đã tồn tại: " + updateDTO.getEmail());
        }

        // Cập nhật thông tin cơ bản
        employee.setName(updateDTO.getName());
        employee.setEmail(updateDTO.getEmail());
        employee.setPhoneNumber(updateDTO.getPhoneNumber());
        employee.setGender(updateDTO.getGender());
        employee.setAddress(updateDTO.getAddress());
        employee.setAvatar(updateDTO.getAvatar());
        // Cập nhật position
        if (updateDTO.getPosition() != null) {
            employee.setPosition(updateDTO.getPosition());
        }
        // Cập nhật office
        if (updateDTO.getOfficeId() != null) {
            Office office = officeRepository.findById(updateDTO.getOfficeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy văn phòng với ID: " + updateDTO.getOfficeId()));
            employee.setOffice(office);
        }

        // Chỉ cập nhật mật khẩu nếu người dùng nhập mật khẩu mới (không rỗng)
        if (updateDTO.getPassword() != null && !updateDTO.getPassword().isEmpty()) {
            // Mã hóa mật khẩu mới trước khi lưu
            employee.setPassword(passwordEncoder.encode(updateDTO.getPassword()));
        }
        Employee savedEmployee = employeeRepository.save(employee);
        return convertToDTO(savedEmployee);
    }

    public void deleteEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        // Xóa avatar khi xóa employee
        if (employee.getAvatar() != null && !employee.getAvatar().isEmpty()) {
            fileUploadService.deleteAvatar(employee.getAvatar());
        }

        employeeRepository.delete(employee);
    }


    //thông kê trạng thái
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Tổng số nhân viên
        long totalEmployees = employeeRepository.count();
        stats.put("totalEmployees", totalEmployees);

        // Thống kê theo chức vụ
        Map<String, Long> positionStats = new HashMap<>();
        for (Position position : Position.values()) {
            long count = employeeRepository.countByPosition(position);
            positionStats.put(position.getJapaneseName(), count);
        }
        stats.put("positionStats", positionStats);

        // Thống kê theo văn phòng
        Map<String, Long> officeStats = new HashMap<>();
        List<Office> offices = officeRepository.findAll();
        for (Office office : offices) {
            long count = employeeRepository.countByOfficeId(office.getId());
            officeStats.put(office.getName(), count);
        }
        stats.put("officeStats", officeStats);

        return stats;
    }

    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setName(employee.getName());
        dto.setUsername(employee.getUsername());
        dto.setEmail(employee.getEmail());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setGender(employee.getGender());
        dto.setAddress(employee.getAddress());
        dto.setPosition(employee.getPosition());
        dto.setOfficeId(employee.getOffice().getId());
        dto.setOfficeName(employee.getOffice().getName());
        dto.setAvatar(employee.getAvatar());

        dto.setRole(employee.getRole());
        return dto;
    }

    public void changePassword(Long employeeId, PasswordChangeDTO passwordChangeDTO) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        // Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(passwordChangeDTO.getCurrentPassword(), employee.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        // Kiểm tra mật khẩu mới và xác nhận khớp nhau
        if (!passwordChangeDTO.getNewPassword().equals(passwordChangeDTO.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Cập nhật mật khẩu mới
        employee.setPassword(passwordEncoder.encode(passwordChangeDTO.getNewPassword()));
        employeeRepository.save(employee);
    }

    public void changePassword(Long employeeId, ResetPasswordRequestDTO passwordResetToken) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));



        // Kiểm tra mật khẩu mới và xác nhận khớp nhau
        if (!passwordResetToken.getPassword().equals(passwordResetToken.getComfirmPass())) {
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Cập nhật mật khẩu mới
        employee.setPassword(passwordEncoder.encode(passwordResetToken.getPassword()));
        employeeRepository.save(employee);
    }



    public EmployeeDTO updateEmployeeAvatar(Long employeeId, String avatarFilename) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        // Xóa avatar cũ nếu có
        if (employee.getAvatar() != null && !employee.getAvatar().isEmpty()) {
            fileUploadService.deleteAvatar(employee.getAvatar());
        }

        employee.setAvatar(avatarFilename);
        Employee savedEmployee = employeeRepository.save(employee);

        return convertToDTO(savedEmployee);
    }


}

