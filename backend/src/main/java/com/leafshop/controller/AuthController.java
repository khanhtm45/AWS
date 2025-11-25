package com.leafshop.controller;

import com.leafshop.dto.auth.AuthResponse;
import com.leafshop.dto.auth.LoginRequest;
import com.leafshop.dto.auth.RegisterRequest;
import com.leafshop.service.AuthService;
import com.leafshop.dto.auth.RequestResetRequest;
import com.leafshop.dto.auth.VerifyOtpRequest;
import com.leafshop.dto.auth.ResetPasswordRequest;
import com.leafshop.service.PasswordResetService;
import com.leafshop.service.RefreshTokenService;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.auth.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;
    private final com.leafshop.repository.UserTableRepository userTableRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponse resp = authService.register(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse resp = authService.login(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/request-reset")
    public ResponseEntity<?> requestReset(@Valid @RequestBody RequestResetRequest req) {
        passwordResetService.requestReset(req);
        // Return 200 even if user not found to avoid account enumeration
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        boolean ok = passwordResetService.verifyOtp(req);
        if (!ok) return ResponseEntity.badRequest().body("Invalid or expired OTP");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        boolean ok = passwordResetService.resetPassword(req);
        if (!ok) return ResponseEntity.badRequest().body("Invalid OTP or user");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return ResponseEntity.badRequest().build();
        // Trim possible JSON quotes
        refreshToken = refreshToken.replaceAll("^\"|\"$", "");
        var tokenOpt = refreshTokenService.findByValue(refreshToken);
        if (tokenOpt.isEmpty()) return ResponseEntity.status(401).build();
        UserTable token = tokenOpt.get();

        // Rotate refresh token
        long refreshValidityMs = 7L * 24 * 60 * 60 * 1000; // 7 days, keep in sync with AuthService
        var newTokenOpt = refreshTokenService.rotateToken(token, refreshValidityMs);
        if (newTokenOpt.isEmpty()) return ResponseEntity.status(401).build();
        UserTable newRefresh = newTokenOpt.get();

        // load account meta to get username
        var metaOpt = userTableRepository.findByPkAndSk(token.getPk(), "ACCOUNT");
        String username = metaOpt.map(UserTable::getUsername).orElse(null);
        if (username == null) return ResponseEntity.status(401).build();

        String accessToken = jwtUtil.generateToken(username);
        return ResponseEntity.ok(new com.leafshop.dto.auth.AuthResponse(accessToken, "Bearer", newRefresh.getTokenValue(), newRefresh.getExpiresAt()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return ResponseEntity.badRequest().build();
        refreshToken = refreshToken.replaceAll("^\"|\"$", "");
        var tokenOpt = refreshTokenService.findByValue(refreshToken);
        if (tokenOpt.isPresent()) {
            refreshTokenService.revokeToken(tokenOpt.get());
        }
        return ResponseEntity.ok().build();
    }
}
