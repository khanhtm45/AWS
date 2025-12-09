package com.leafshop.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class InMemoryOtpService {

    private static final int OTP_EXPIRATION_MINUTES = 5;
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    private static class OtpData {

        String otp;
        Instant expiryTime;

        OtpData(String otp, Instant expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }

    public void saveOtp(String email, String otp) {
        String key = email.toLowerCase();
        Instant expiryTime = Instant.now().plusSeconds(OTP_EXPIRATION_MINUTES * 60);
        otpStore.put(key, new OtpData(otp, expiryTime));
        log.info("OTP saved for email: {} with expiration: {} minutes", email, OTP_EXPIRATION_MINUTES);
    }

    public String getOtp(String email) {
        String key = email.toLowerCase();
        OtpData data = otpStore.get(key);

        if (data == null) {
            return null;
        }

        if (Instant.now().isAfter(data.expiryTime)) {
            otpStore.remove(key);
            log.info("OTP expired for email: {}", email);
            return null;
        }

        return data.otp;
    }

    public void deleteOtp(String email) {
        String key = email.toLowerCase();
        otpStore.remove(key);
        log.info("OTP deleted for email: {}", email);
    }

    public boolean hasOtp(String email) {
        String key = email.toLowerCase();
        OtpData data = otpStore.get(key);

        if (data == null) {
            return false;
        }

        if (Instant.now().isAfter(data.expiryTime)) {
            otpStore.remove(key);
            return false;
        }

        return true;
    }

    public Long getOtpTtl(String email) {
        String key = email.toLowerCase();
        OtpData data = otpStore.get(key);

        if (data == null) {
            return -2L;
        }

        long ttl = data.expiryTime.getEpochSecond() - Instant.now().getEpochSecond();
        return ttl > 0 ? ttl : -1L;
    }

    public String generateOtp() {
        return String.format("%06d", (int) (Math.random() * 1000000));
    }
}
