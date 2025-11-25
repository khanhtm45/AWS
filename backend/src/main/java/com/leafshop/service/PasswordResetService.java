package com.leafshop.service;

import com.leafshop.dto.auth.ResetPasswordRequest;
import com.leafshop.dto.auth.RequestResetRequest;
import com.leafshop.dto.auth.VerifyOtpRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserTableRepository userTableRepository;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;

    private final Random random = new Random();

    public void requestReset(RequestResetRequest req) {
        // find account by username or email
        Optional<UserTable> accountOpt = userTableRepository.findAccountByUsername(req.getUsernameOrEmail());
        if (accountOpt.isEmpty()) {
            // try search by email (scan)
            accountOpt = userTableRepository.findAccountByEmail(req.getUsernameOrEmail());
        }

        String pk;
        if (accountOpt.isPresent()) {
            UserTable account = accountOpt.get();
            pk = account.getPk();
        } else {
            // don't reveal existence — still create a temporary token entry associated with the email
            // Use PK prefix EMAIL# to indicate token for non-registered email
            pk = "EMAIL#" + req.getUsernameOrEmail().toLowerCase();
        }

        // generate 6-digit OTP
        int otpInt = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpInt);

        String tokenId = UUID.randomUUID().toString();
        long expiresAt = Instant.now().plusSeconds(5 * 60).toEpochMilli(); // 5 minutes

        UserTable token = UserTable.builder()
            .pk(pk)
            .sk("TOKEN#" + tokenId)
            .itemType("TOKEN")
            .tokenValue(otp)
            .tokenType("OTP")
            .expiresAt(expiresAt)
            .createdAt(System.currentTimeMillis())
            .build();

        userTableRepository.save(token);

        // send email if we have an email address (either from found account or from request)
        String emailToSend = req.getUsernameOrEmail();
        if (accountOpt.isPresent()) {
            var acc = accountOpt.get();
            if (acc.getEmail() != null && !acc.getEmail().isBlank()) emailToSend = acc.getEmail();
        }

        if (emailToSend != null && !emailToSend.isBlank()) {
            String subject = "Your OTP code";
            String text = "Mã xác thực của bạn: " + otp + " (hết hạn trong 5 phút)";
            mailService.sendSimpleEmail(emailToSend, subject, text);
        }
    }

    public boolean verifyOtp(VerifyOtpRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(req.getUsername());
        if (accountOpt.isEmpty()) return false;
        String pk = accountOpt.get().getPk();

        var tokenOpt = userTableRepository.findTokenByPkValueAndType(pk, req.getOtp(), "OTP");
        if (tokenOpt.isEmpty()) return false;
        UserTable token = tokenOpt.get();
        if (token.getExpiresAt() == null || token.getExpiresAt() < System.currentTimeMillis()) return false;
        return true;
    }

    public boolean resetPassword(ResetPasswordRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(req.getUsername());
        if (accountOpt.isEmpty()) return false;
        String pk = accountOpt.get().getPk();

        var tokenOpt = userTableRepository.findTokenByPkValueAndType(pk, req.getOtp(), "OTP");
        if (tokenOpt.isEmpty()) return false;
        UserTable token = tokenOpt.get();
        if (token.getExpiresAt() == null || token.getExpiresAt() < System.currentTimeMillis()) return false;

        UserTable account = accountOpt.get();
        account.setPassword(passwordEncoder.encode(req.getNewPassword()));
        account.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(account);

        // Optionally mark token as used by deleting or setting tokenType
        token.setTokenType("USED");
        userTableRepository.save(token);

        return true;
    }
}
