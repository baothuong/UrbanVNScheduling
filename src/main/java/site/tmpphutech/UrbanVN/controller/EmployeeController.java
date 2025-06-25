package site.tmpphutech.UrbanVN.controller;

import site.tmpphutech.UrbanVN.dto.EmployeeCreateDTO;
import site.tmpphutech.UrbanVN.dto.EmployeeDTO;
import site.tmpphutech.UrbanVN.dto.EmployeeUpdateDTO;
import site.tmpphutech.UrbanVN.dto.PasswordChangeDTO;
import site.tmpphutech.UrbanVN.enums.Position;
import site.tmpphutech.UrbanVN.service.EmployeeService;
import site.tmpphutech.UrbanVN.service.FileUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final FileUploadService fileUploadService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @RequestParam(required = false) Long officeId,
            @RequestParam(required = false) Position position,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EmployeeDTO> employees = employeeService.getAllEmployees(officeId, position,keyword, pageable);
        return ResponseEntity.ok(employees);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody EmployeeCreateDTO createDTO) {
        EmployeeDTO employee = employeeService.createEmployee(createDTO);
        return new ResponseEntity<>(employee, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable Long id,
                                                      @Valid @RequestBody EmployeeUpdateDTO updateDTO) {
        EmployeeDTO employee = employeeService.updateEmployee(id, updateDTO);
        return ResponseEntity.ok(employee);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = employeeService.getStatistics();
        return ResponseEntity.ok(stats);
    }


    @PutMapping("/{id}/change-password")
    public ResponseEntity<String> changePassword(@PathVariable Long id,
                                                 @Valid @RequestBody PasswordChangeDTO passwordChangeDTO) {
        employeeService.changePassword(id, passwordChangeDTO);
        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }

    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<EmployeeDTO> uploadAvatar(@PathVariable Long id,
                                                    @RequestParam("file") MultipartFile file) {
        String filename = fileUploadService.uploadAvatar(file);
        EmployeeDTO employee = employeeService.updateEmployeeAvatar(id, filename);
        return ResponseEntity.ok(employee);
    }

    @DeleteMapping("/{id}/avatar")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<EmployeeDTO> deleteAvatar(@PathVariable Long id) {
        EmployeeDTO employee = employeeService.updateEmployeeAvatar(id, null);
        return ResponseEntity.ok(employee);
    }
}

