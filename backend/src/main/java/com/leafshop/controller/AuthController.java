package com.leafshop.controller;

import com.leafshop.dto.auth.AuthResponse;
import com.leafshop.dto.auth.LoginRequest;
import com.leafshop.dto.auth.RegisterRequest;
import com.leafshop.service.AuthService;
import com.leafshop.dto.auth.RequestResetRequest;
import com.leafshop.dto.auth.VerifyOtpRequest;
import com.leafshop.dto.auth.ResetPasswordRequest;
import com.leafshop.dto.auth.LoginOtpRequest;
import com.leafshop.dto.auth.VerifyLoginOtpRequest;
import com.leafshop.service.PasswordResetService;
import com.leafshop.service.RefreshTokenService;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.auth.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.leafshop.dto.auth.RequestOtpRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            AuthResponse resp = authService.login(req);
            return ResponseEntity.ok(resp);
        } catch (RuntimeException e) {
            String msg = e.getMessage() == null ? "Unauthorized" : e.getMessage();
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized", "message", msg));
        }
    }

    @PostMapping("/login-staff")
    public ResponseEntity<?> loginStaff(@Valid @RequestBody LoginRequest req) {
        try {
            AuthResponse resp = authService.loginStaff(req);
            return ResponseEntity.ok(resp);
        } catch (RuntimeException e) {
            String msg = e.getMessage() == null ? "Unauthorized" : e.getMessage();
            if ("Not authorized".equalsIgnoreCase(msg)) {
                return ResponseEntity.status(403).body(Map.of("error", "forbidden", "message", msg));
            }
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized", "message", msg));
        }
    }

    @PostMapping("/request-reset")
    public ResponseEntity<?> requestReset(@Valid @RequestBody RequestResetRequest req) {
        passwordResetService.requestReset(req);
        // Return 200 even if user not found to avoid account enumeration
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request-login-otp")
    public ResponseEntity<?> requestLoginOtp(@Valid @RequestBody LoginOtpRequest req) {
        RequestResetRequest r = new RequestResetRequest();
        r.setUsernameOrEmail(req.getEmail());
        passwordResetService.requestReset(r);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody RequestOtpRequest req) {
        // If accountId provided, try lookup by PK
        if (req.getAccountId() != null && !req.getAccountId().isBlank()) {
            String pk = req.getAccountId().startsWith("USER#") ? req.getAccountId() : "USER#" + req.getAccountId();
            var accOpt = userTableRepository.findAccountByPk(pk);
            if (accOpt.isEmpty()) return ResponseEntity.badRequest().body("Account not found");
            var acc = accOpt.get();
            // prefer email if present, otherwise use username to generate token (will still create token tied to user pk)
            String identifier = (acc.getEmail() != null && !acc.getEmail().isBlank()) ? acc.getEmail() : acc.getUsername();
            RequestResetRequest r = new RequestResetRequest();
            r.setUsernameOrEmail(identifier);
            passwordResetService.requestReset(r);
            return ResponseEntity.ok().build();
        }

        // Else if email provided, fallback to existing flow
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            RequestResetRequest r = new RequestResetRequest();
            r.setUsernameOrEmail(req.getEmail());
            passwordResetService.requestReset(r);
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.badRequest().body("Provide email or accountId");
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@Valid @RequestBody VerifyLoginOtpRequest req) {
        // Derive expected PK for this email (either existing USER#... or EMAIL#<email>)
        String expectedPk;
        var accByEmail = userTableRepository.findAccountByEmail(req.getEmail());
        if (accByEmail.isPresent()) {
            expectedPk = accByEmail.get().getPk();
        } else {
            expectedPk = "EMAIL#" + req.getEmail().toLowerCase();
        }

        log.debug("verifyLoginOtp: email={} expectedPk={}", req.getEmail(), expectedPk);

        // find token by PK, value and type to avoid collisions across different users
        var tokenOpt = userTableRepository.findTokenByPkValueAndType(expectedPk, req.getOtp(), "OTP");
        if (tokenOpt.isEmpty()) return ResponseEntity.badRequest().body("Invalid or expired OTP");
        var token = tokenOpt.get();
        log.debug("verifyLoginOtp: matched token pk={} sk={} expiresAt={}", token.getPk(), token.getSk(), token.getExpiresAt());
        if (token.getExpiresAt() == null || token.getExpiresAt() < System.currentTimeMillis()) return ResponseEntity.badRequest().body("Invalid or expired OTP");

        String pk = token.getPk();

        // If token PK indicates unregistered email, create account
        com.leafshop.model.dynamodb.UserTable account = null;
        if (pk != null && pk.startsWith("USER#")) {
            var accOpt = userTableRepository.findAccountByPk(pk);
            if (accOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid token owner");
            account = accOpt.get();
        } else {
            // create new user
            String userId = java.util.UUID.randomUUID().toString();
            String newPk = "USER#" + userId;
            long now = System.currentTimeMillis();

            // META item (minimal)
            com.leafshop.model.dynamodb.UserTable meta = com.leafshop.model.dynamodb.UserTable.builder()
                .pk(newPk)
                .sk("META")
                .itemType("META")
                .email(req.getEmail())
                .createdAt(now)
                .updatedAt(now)
                .build();

            // ACCOUNT item
            String username = req.getEmail().split("@")[0] + "-" + java.util.UUID.randomUUID().toString().substring(0,6);
            com.leafshop.model.dynamodb.UserTable acc = com.leafshop.model.dynamodb.UserTable.builder()
                .pk(newPk)
                .sk("ACCOUNT")
                .itemType("ACCOUNT")
                .username(username)
                .email(req.getEmail())
                .role("Customer".toUpperCase())
                .roleId("CUSTOMER")
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

            userTableRepository.save(meta);
            userTableRepository.save(acc);
            account = acc;
        }

        // mark OTP token as used
        token.setTokenType("USED");
        userTableRepository.save(token);

        // Generate access token and refresh token here
        String accessToken = jwtUtil.generateToken(account.getUsername());

        String refreshValue = java.util.UUID.randomUUID().toString();
        String tokenId = java.util.UUID.randomUUID().toString();
        long refreshValidityMs = 7L * 24 * 60 * 60 * 1000;
        com.leafshop.model.dynamodb.UserTable refresh = com.leafshop.model.dynamodb.UserTable.builder()
            .pk(account.getPk())
            .sk("TOKEN#" + tokenId)
            .itemType("TOKEN")
            .tokenValue(refreshValue)
            .tokenType("REFRESH_TOKEN")
            .expiresAt(System.currentTimeMillis() + refreshValidityMs)
            .createdAt(System.currentTimeMillis())
            .build();
        userTableRepository.save(refresh);

        return ResponseEntity.ok(new com.leafshop.dto.auth.AuthResponse(accessToken, "Bearer", refresh.getTokenValue(), refresh.getExpiresAt()));
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
