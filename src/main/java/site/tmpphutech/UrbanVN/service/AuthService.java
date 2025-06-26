// AuthService.java
package site.tmpphutech.UrbanVN.service;

import site.tmpphutech.UrbanVN.dto.LoginRequestDTO;
import site.tmpphutech.UrbanVN.dto.LoginResponseDTO;
import site.tmpphutech.UrbanVN.dto.EmployeeDTO;
import site.tmpphutech.UrbanVN.exception.InvalidCredentialsException;
import site.tmpphutech.UrbanVN.model.Employee;
import site.tmpphutech.UrbanVN.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public LoginResponseDTO login(LoginRequestDTO loginRequest) {
        try {
            // Xác thực thông tin đăng nhập
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Lưu authentication vào SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Lấy thông tin employee
            Employee employee = employeeRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new InvalidCredentialsException("無効なログイン情報"));

            // Tạo response
            LoginResponseDTO response = new LoginResponseDTO();
            response.setMessage("ログインに成功しました");
            response.setEmployee(convertToEmployeeDTO(employee));

            return response;

        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException("ユーザー名またはパスワードが間違っています");
        }
    }

    public void logout() {
        SecurityContextHolder.clearContext();
    }

    public Employee getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null &&
                authentication.isAuthenticated() &&
                !(authentication instanceof AnonymousAuthenticationToken)) {

            String username = authentication.getName();
            return employeeRepository.findByUsername(username).orElse(null);
        }
        return null;
    }



    public boolean isCurrentUserAdmin() {
        Employee currentUser = getCurrentUser();
        return currentUser != null && currentUser.getRole().name().equals("ADMIN");
    }

    private EmployeeDTO convertToEmployeeDTO(Employee employee) {
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
}
