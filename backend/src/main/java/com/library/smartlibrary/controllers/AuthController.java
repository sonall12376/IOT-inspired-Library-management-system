package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.RefreshToken;
import com.library.smartlibrary.models.User;
import com.library.smartlibrary.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    // Register Request Body DTO
    public static class RegisterRequest {
        public String name;
        public String email;
        public String password;
    }

    // Login Request Body DTO
    public static class LoginRequest {
        public String email;
        public String password;
    }

    // Refresh Request Body DTO
    public static class RefreshRequest {
        public String refreshToken;
    }

    // Forgot Password Request
    public static class ForgotPasswordRequest {
        public String email;
    }

    // Reset Password Request
    public static class ResetPasswordRequest {
        public String token;
        public String password;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            if (req.name == null || req.email == null || req.password == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "All fields are required"));
            }
            User user = userService.registerUser(req.name, req.email, req.password);
            return ResponseEntity.status(201).body(Map.of("success", true, "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole()
            )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.email == null || req.password == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email and password required"));
        }
        Optional<User> userOpt = userService.findByEmail(req.email);
        if (userOpt.isEmpty() || !userService.comparePassword(userOpt.get(), req.password)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid email or password"));
        }

        User user = userOpt.get();
        String accessToken = userService.createAccessToken(user);
        RefreshToken refreshToken = userService.createRefreshToken(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", accessToken,
                "refreshToken", refreshToken.getToken(),
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                )
        ));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
        }

        User user = userOpt.get();
        return ResponseEntity.ok(Map.of("success", true, "user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        )));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        if (req.refreshToken == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Refresh token required"));
        }

        Optional<RefreshToken> tokenOpt = userService.getRefreshToken(req.refreshToken);
        if (tokenOpt.isEmpty() || tokenOpt.get().getExpiresAt().before(new Date())) {
            if (tokenOpt.isPresent()) {
                userService.revokeRefreshToken(req.refreshToken);
            }
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid or expired refresh token"));
        }

        RefreshToken oldToken = tokenOpt.get();
        Optional<User> userOpt = userService.findById(oldToken.getUserId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "User no longer exists"));
        }

        User user = userOpt.get();
        userService.revokeRefreshToken(oldToken.getToken()); // Rotate token (optional, matches node logic)

        String newAccess = userService.createAccessToken(user);
        RefreshToken newRefresh = userService.createRefreshToken(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", newAccess,
                "refreshToken", newRefresh.getToken()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshRequest req) {
        if (req.refreshToken != null) {
            userService.revokeRefreshToken(req.refreshToken);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        Optional<User> userOpt = userService.findByEmail(req.email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Email not registered"));
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordExpires(new Date(System.currentTimeMillis() + 3600000)); // 1 hour
        userService.save(user);

        // Standard response showing mock email reset link (matching Node.js behavior)
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reset link generated successfully",
                "token", token
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        Optional<User> userOpt = userService.findByResetPasswordToken(req.token);
        if (userOpt.isEmpty() || userOpt.get().getResetPasswordExpires().before(new Date())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid or expired reset token"));
        }

        User user = userOpt.get();
        user.setPassword(userService.registerUser("", "", req.password).getPassword()); // reuse password hasher
        user.setResetPasswordToken(null);
        user.setResetPasswordExpires(null);
        userService.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successfully. You can now login."));
    }
}
