package com.leafshop.service;

import com.leafshop.auth.JwtUtil;
import com.leafshop.dto.auth.AuthResponse;
import com.leafshop.dto.auth.LoginRequest;
import com.leafshop.dto.auth.RegisterRequest;
import com.leafshop.model.dynamodb.UserTable;
// role table removed; no RoleRepository
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserTableRepository userTableRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final InMemoryOtpService otpService;
    private final EmailService emailService;
    // removed RoleRepository
    // refresh token validity (ms)
    private final long refreshTokenValidityMs = 7L * 24 * 60 * 60 * 1000; // 7 days

    public AuthResponse register(RegisterRequest req) {
        String userId = UUID.randomUUID().toString();
        String pk = "USER#" + userId;

        long now = System.currentTimeMillis();

        // META item
        UserTable meta = UserTable.builder()
                .pk(pk)
                .sk("META")
                .itemType("META")
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .phoneNumber(req.getPhoneNumber())
                .createdAt(now)
                .updatedAt(now)
                .build();

        // determine role (use provided role if present, else default to Staff)
        String roleName = (req.getRole() != null && !req.getRole().isBlank()) ? req.getRole() : "Staff";
        String resolvedRoleId = roleName.toUpperCase();

        // ACCOUNT item
        UserTable account = UserTable.builder()
                .pk(pk)
                .sk("ACCOUNT")
                .itemType("ACCOUNT")
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(roleName.toUpperCase())
                .roleId(resolvedRoleId)
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        userTableRepository.save(meta);
        userTableRepository.save(account);

        String token = jwtUtil.generateToken(account.getUsername());

        // create refresh token
        String refreshValue = UUID.randomUUID().toString();
        String tokenId = UUID.randomUUID().toString();
        UserTable refresh = UserTable.builder()
                .pk(pk)
                .sk("TOKEN#" + tokenId)
                .itemType("TOKEN")
                .tokenValue(refreshValue)
                .tokenType("REFRESH_TOKEN")
                .expiresAt(System.currentTimeMillis() + refreshTokenValidityMs)
                .createdAt(System.currentTimeMillis())
                .build();
        userTableRepository.save(refresh);

        return new AuthResponse(token, "Bearer", refreshValue, refresh.getExpiresAt());
    }

    public AuthResponse login(LoginRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(req.getUsername());
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }
        UserTable account = accountOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), account.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(account.getUsername());

        String refreshValue = UUID.randomUUID().toString();
        String tokenId = UUID.randomUUID().toString();
        UserTable refresh = UserTable.builder()
                .pk(account.getPk())
                .sk("TOKEN#" + tokenId)
                .itemType("TOKEN")
                .tokenValue(refreshValue)
                .tokenType("REFRESH_TOKEN")
                .expiresAt(System.currentTimeMillis() + refreshTokenValidityMs)
                .createdAt(System.currentTimeMillis())
                .build();
        userTableRepository.save(refresh);

        return new AuthResponse(token, "Bearer", refreshValue, refresh.getExpiresAt());
    }

    /**
     * Login for staff/manager/admin accounts using username/password. Only
     * allows accounts with roleId or role matching STAFF, MANAGER or ADMIN.
     */
    public AuthResponse loginStaff(LoginRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(req.getUsername());
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }
        UserTable account = accountOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), account.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String role = (account.getRoleId() != null) ? account.getRoleId().toUpperCase() : (account.getRole() != null ? account.getRole().toUpperCase() : "");
        if (!("ADMIN".equals(role) || "MANAGER".equals(role) || "STAFF".equals(role))) {
            throw new RuntimeException("Not authorized");
        }

        String token = jwtUtil.generateToken(account.getUsername());

        String refreshValue = UUID.randomUUID().toString();
        String tokenId = UUID.randomUUID().toString();
        UserTable refresh = UserTable.builder()
                .pk(account.getPk())
                .sk("TOKEN#" + tokenId)
                .itemType("TOKEN")
                .tokenValue(refreshValue)
                .tokenType("REFRESH_TOKEN")
                .expiresAt(System.currentTimeMillis() + refreshTokenValidityMs)
                .createdAt(System.currentTimeMillis())
                .build();
        userTableRepository.save(refresh);

        return new AuthResponse(token, "Bearer", refreshValue, refresh.getExpiresAt());
    }

    /**
     * Send OTP to user's email for login/register Allows any email - will
     * auto-create account if doesn't exist
     *
     * @param email User's email
     */
    public void sendLoginOtp(String email) {
        // 1. Check if email exists in database
        var accountOpt = userTableRepository.findAccountByEmail(email);
        String username = null;

        if (accountOpt.isPresent()) {
            UserTable account = accountOpt.get();

            // Check if account is active
            if (account.getIsActive() != null && !account.getIsActive()) {
                throw new RuntimeException("Tài khoản đã bị khóa");
            }

            username = account.getUsername();
        }
        // If email doesn't exist, that's OK - we'll create account during verification

        // 2. Generate OTP
        String otp = otpService.generateOtp();

        // 3. Save OTP to Redis (TTL = 5 minutes)
        otpService.saveOtp(email, otp);

        // 4. Send email
        String subject = "Mã OTP đăng nhập - Leaf Shop";
        String htmlBody = buildOtpEmailHtml(otp, username != null ? username : email.split("@")[0]);

        boolean sent = emailService.sendHtmlEmail(email, subject, htmlBody);
        if (!sent) {
            throw new RuntimeException("Không thể gửi email. Vui lòng thử lại sau");
        }
    }

    /**
     * Verify OTP and login user (auto-register if new email)
     *
     * @param email User's email
     * @param otp OTP code
     * @return AuthResponse with tokens
     */
    public AuthResponse verifyLoginOtp(String email, String otp) {
        // 1. Get OTP from Redis
        String savedOtp = otpService.getOtp(email);

        if (savedOtp == null) {
            throw new RuntimeException("OTP đã hết hạn hoặc không tồn tại");
        }

        // 2. Verify OTP
        if (!savedOtp.equals(otp)) {
            throw new RuntimeException("OTP không chính xác");
        }

        // 3. Delete OTP from Redis
        otpService.deleteOtp(email);

        // 4. Get or create user account
        var accountOpt = userTableRepository.findAccountByEmail(email);
        UserTable account;

        if (accountOpt.isEmpty()) {
            // Auto-register new user
            account = createNewUserFromEmail(email);
        } else {
            account = accountOpt.get();
        }

        // 5. Generate JWT token
        String token = jwtUtil.generateToken(account.getUsername());

        // 6. Create refresh token
        String refreshValue = UUID.randomUUID().toString();
        String tokenId = UUID.randomUUID().toString();
        UserTable refresh = UserTable.builder()
                .pk(account.getPk())
                .sk("TOKEN#" + tokenId)
                .itemType("TOKEN")
                .tokenValue(refreshValue)
                .tokenType("REFRESH_TOKEN")
                .expiresAt(System.currentTimeMillis() + refreshTokenValidityMs)
                .createdAt(System.currentTimeMillis())
                .build();
        userTableRepository.save(refresh);

        return new AuthResponse(token, "Bearer", refreshValue, refresh.getExpiresAt());
    }

    /**
     * Create new user account from email (auto-registration)
     */
    private UserTable createNewUserFromEmail(String email) {
        String userId = UUID.randomUUID().toString();
        String pk = "USER#" + userId;
        long now = System.currentTimeMillis();

        // Generate username from email
        String baseUsername = email.split("@")[0];
        String username = baseUsername + "-" + UUID.randomUUID().toString().substring(0, 6);

        // Extract name from email if possible
        String firstName = baseUsername;
        String lastName = "";

        // META item
        UserTable meta = UserTable.builder()
                .pk(pk)
                .sk("META")
                .itemType("META")
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // ACCOUNT item
        UserTable account = UserTable.builder()
                .pk(pk)
                .sk("ACCOUNT")
                .itemType("ACCOUNT")
                .username(username)
                .email(email)
                .role("CUSTOMER")
                .roleId("CUSTOMER")
                .isActive(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        userTableRepository.save(meta);
        userTableRepository.save(account);

        return account;
    }

    /**
     * Build HTML email template for OTP
     */
    private String buildOtpEmailHtml(String otp, String username) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset='UTF-8'>"
                + "<style>"
                + "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + ".container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + ".header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }"
                + ".content { background-color: #f9f9f9; padding: 30px; }"
                + ".otp-box { background-color: #ffffff; border: 2px solid #4CAF50; padding: 20px; "
                + "text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; "
                + "margin: 20px 0; border-radius: 5px; }"
                + ".footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }"
                + ".warning { color: #f44336; font-size: 14px; margin-top: 15px; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class='container'>"
                + "<div class='header'>"
                + "<h1>🍃 Leaf Shop</h1>"
                + "</div>"
                + "<div class='content'>"
                + "<h2>Xin chào " + (username != null ? username : "bạn") + "!</h2>"
                + "<p>Bạn đã yêu cầu đăng nhập vào hệ thống bằng mã OTP.</p>"
                + "<p>Mã OTP của bạn là:</p>"
                + "<div class='otp-box'>" + otp + "</div>"
                + "<p>Mã này có hiệu lực trong <strong>5 phút</strong>.</p>"
                + "<p class='warning'>⚠️ Không chia sẻ mã này với bất kỳ ai!</p>"
                + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>"
                + "</div>"
                + "<div class='footer'>"
                + "<p>&copy; 2025 Leaf Shop. All rights reserved.</p>"
                + "</div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}
