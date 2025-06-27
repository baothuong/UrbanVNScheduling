// Cập nhật AuthController.java
package site.tmpphutech.UrbanVN.controller;

import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import site.tmpphutech.UrbanVN.dto.*;
import site.tmpphutech.UrbanVN.model.Employee;
import site.tmpphutech.UrbanVN.model.PasswordResetToken;
import site.tmpphutech.UrbanVN.service.AuthService;
import site.tmpphutech.UrbanVN.service.EmailService;
import site.tmpphutech.UrbanVN.service.EmployeeService;
import site.tmpphutech.UrbanVN.service.PasswordResetTokenService;
import site.tmpphutech.UrbanVN.util.SecurityUtil;
import jakarta.servlet.SessionCookieConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;
    private final PasswordResetTokenService passwordResetTokenService;
    private  final EmployeeService employeeService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest,
                                                  HttpServletRequest request) {

        System.out.println("=== LOGIN REQUEST DEBUG ===");
        System.out.println("Username: " + loginRequest.getUsername());
        System.out.println("Request Origin: " + request.getHeader("Origin"));
        System.out.println("Request User-Agent: " + request.getHeader("User-Agent"));
        System.out.println("Request Method: " + request.getMethod());

        try {
            LoginResponseDTO response = authService.login(loginRequest);

            // Tạo session và lưu SecurityContext
            HttpSession session = request.getSession(true);
            SecurityContext context = SecurityContextHolder.getContext();
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            // Debug session info
            System.out.println("=== SESSION CREATED ===");
            System.out.println("Session ID: " + session.getId());
            System.out.println("Session Max Inactive: " + session.getMaxInactiveInterval() + " seconds");
            System.out.println("Session Creation Time: " + new java.util.Date(session.getCreationTime()));
            System.out.println("Session IsNew: " + session.isNew());

            // Debug cookie config
            SessionCookieConfig cookieConfig = request.getServletContext().getSessionCookieConfig();
            System.out.println("Cookie Name: " + cookieConfig.getName());
            System.out.println("Cookie HttpOnly: " + cookieConfig.isHttpOnly());
            System.out.println("Cookie Secure: " + cookieConfig.isSecure());
            System.out.println("Cookie Path: " + cookieConfig.getPath());
            System.out.println("Cookie Max Age: " + cookieConfig.getMaxAge());

            response.setSessionId(session.getId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("Login failed: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    /*@PostMapping("/forget-password")
    public ResponseEntity<String> forgetPassword(@RequestBody ForgetPasswordRequestDTO request) {
        String email = request.getEmail();
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        Optional<PasswordResetToken> opt = passwordResetTokenService.findByEmail(email);
        String newToken = SecurityUtil.generateRandomToken();
        LocalDateTime newExpiry = LocalDateTime.now().plusMinutes(30);

        if(opt.isPresent()) {
            PasswordResetToken token = opt.get();
            token.setToken(newToken);
            token.setExpiryDate(newExpiry);
            passwordResetTokenService.save(token);
        } else {
            PasswordResetToken token = new PasswordResetToken();
            token.setEmail(email);
            token.setToken(newToken);
            token.setExpiryDate(newExpiry);
            passwordResetTokenService.save(token);
        }
        String resetPasswordLink = "http://localhost:8080/reset-password.html?token=" + newToken;

        try{
            emailService.sendForgotPasswordEmail(email, resetPasswordLink);
            return ResponseEntity.ok("Gửi email đến người dùng thành công");
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Gửi email đến người dùng thất bại");
        }

    }
*/

    @PostMapping("/forget-password")
    public ResponseEntity<String> forgetPassword(@RequestBody ForgetPasswordRequestDTO request) {
        String email = request.getEmail();
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        Optional<PasswordResetToken> opt = passwordResetTokenService.findByEmail(email);
        String newToken = SecurityUtil.generateRandomToken();
        LocalDateTime newExpiry = LocalDateTime.now().plusMinutes(30);

        if(opt.isPresent()) {
            PasswordResetToken token = opt.get();
            token.setToken(newToken);
            token.setExpiryDate(newExpiry);
            passwordResetTokenService.save(token);
        } else {
            PasswordResetToken token = new PasswordResetToken();
            token.setEmail(email);
            token.setToken(newToken);
            token.setExpiryDate(newExpiry);
            passwordResetTokenService.save(token);
        }

        // Tự động xây dựng URL dựa trên request hiện tại
        String resetPasswordLink = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/reset-password.html")
                .queryParam("token", newToken)
                .toUriString();

        try{
            emailService.sendForgotPasswordEmail(email, resetPasswordLink);
            return ResponseEntity.ok("Gửi email đến người dùng thành công");
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Gửi email đến người dùng thất bại");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        authService.logout();

        // Invalidate session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // Clear SecurityContext
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok("Đăng xuất thành công");
    }

    @GetMapping("/me")
    public ResponseEntity<Object> getCurrentUser(HttpServletRequest request) {
        System.out.println("=== GET CURRENT USER DEBUG ===");
        System.out.println("Request Origin: " + request.getHeader("Origin"));
        System.out.println("Request Cookie Header: " + request.getHeader("Cookie"));
        System.out.println("Request Method: " + request.getMethod());

        // Kiểm tra session
        HttpSession session = request.getSession(false);
        if (session == null) {
            System.out.println("❌ No session found");
            return ResponseEntity.status(401).body("Phiên làm việc đã hết hạn");
        }

        System.out.println("✅ Session found:");
        System.out.println("Session ID: " + session.getId());
        System.out.println("Session Max Inactive: " + session.getMaxInactiveInterval());
        System.out.println("Session Last Accessed: " + new java.util.Date(session.getLastAccessedTime()));
        System.out.println("Session Creation Time: " + new java.util.Date(session.getCreationTime()));

        // Kiểm tra SecurityContext trong session
        SecurityContext context = (SecurityContext) session.getAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);

        if (context == null || context.getAuthentication() == null) {
            System.out.println("❌ No SecurityContext or Authentication in session");
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }

        System.out.println("✅ SecurityContext found");
        System.out.println("Authentication: " + context.getAuthentication().getName());
        System.out.println("Authorities: " + context.getAuthentication().getAuthorities());

        try {
            Employee currentUser = authService.getCurrentUser();
            if (currentUser != null) {
                System.out.println("✅ Current user: " + currentUser.getUsername());
                EmployeeDTO userDTO = convertToEmployeeDTO(currentUser);
                return ResponseEntity.ok(userDTO);
            }
        } catch (Exception e) {
            System.out.println("❌ Error getting current user: " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.status(401).body("Chưa đăng nhập");
    }
    @GetMapping("/check-session")
    public ResponseEntity<?> checkSession(HttpSession session) {
        // Kiểm tra session và trả về thông tin người dùng nếu còn hợp lệ
        if (session != null && session.getAttribute("user") != null) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/resetpassword")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequestDTO resetPasswordRequestDTO){
        Optional<PasswordResetToken> passwordResetToken = passwordResetTokenService.findByToken(resetPasswordRequestDTO.getToken());

        if (passwordResetToken.isPresent()) {
            LocalDateTime now = LocalDateTime.now();

            // ✅ SỬA: Kiểm tra token CÒN HẠN (before expiry date)
            if (now.isBefore(passwordResetToken.get().getExpiryDate())){

                try{
                    EmployeeDTO employeeDTO = employeeService.findEmployeeByEmail(passwordResetToken.get().getEmail());
                    employeeService.changePassword(employeeDTO.getId(), resetPasswordRequestDTO);

                    // ✅ THÊM: Xóa token sau khi sử dụng để tránh tái sử dụng
                    //passwordResetTokenService.deleteToken(resetPasswordRequestDTO.getToken());

                    return ResponseEntity.ok("Đã thay đổi mật khẩu thành công");
                }catch (Exception e){
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi thay đổi mật khẩu: " + e.getMessage());
                }
            }else {
                // ✅ SỬA: Xóa token hết hạn
                //passwordResetTokenService.deleteToken(resetPasswordRequestDTO.getToken());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Link đã hết hạn");
            }
        }else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Liên kết không tồn tại hoặc không hợp lệ");
        }
    }


    // Thêm method helper
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
