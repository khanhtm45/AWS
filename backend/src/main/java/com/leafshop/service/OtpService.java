package com.leafshop.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String OTP_PREFIX = "OTP:";
    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRATION_MINUTES = 5;

    /**
     * Generate a 6-digit OTP code
     */
    public String generateOtp() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }

    /**
     * Save OTP to Redis with 5-minute expiration
     * @param email User's email
     * @param otp OTP code
     */
    public void saveOtp(String email, String otp) {
        String key = OTP_PREFIX + email.toLowerCase();
        redisTemplate.opsForValue().set(key, otp, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);
        log.info("OTP saved for email: {} with expiration: {} minutes", email, OTP_EXPIRATION_MINUTES);
    }

    /**
     * Retrieve OTP from Redis
     * @param email User's email
     * @return OTP code or null if not found/expired
     */
    public String getOtp(String email) {
        String key = OTP_PREFIX + email.toLowerCase();
        Object otp = redisTemplate.opsForValue().get(key);
        return otp != null ? otp.toString() : null;
    }

    /**
     * Delete OTP from Redis (after successful verification)
     * @param email User's email
     */
    public void deleteOtp(String email) {
        String key = OTP_PREFIX + email.toLowerCase();
        redisTemplate.delete(key);
        log.info("OTP deleted for email: {}", email);
    }

    /**
     * Check if OTP exists in Redis
     * @param email User's email
     * @return true if OTP exists
     */
    public boolean hasOtp(String email) {
        String key = OTP_PREFIX + email.toLowerCase();
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Get remaining TTL for OTP in seconds
     * @param email User's email
     * @return TTL in seconds, or -1 if key doesn't exist
     */
    public Long getOtpTtl(String email) {
        String key = OTP_PREFIX + email.toLowerCase();
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }
}
