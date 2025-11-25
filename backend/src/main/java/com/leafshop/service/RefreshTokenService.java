package com.leafshop.service;

import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import com.leafshop.repository.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final UserTableRepository userTableRepository;
    private final RevokedTokenRepository revokedTokenRepository;

    public Optional<UserTable> findByValue(String refreshToken) {
        // if token is revoked, return empty
        var revoked = revokedTokenRepository.findByTokenValue(refreshToken);
        if (revoked.isPresent()) return Optional.empty();
        return userTableRepository.findTokenByValueAndType(refreshToken, "REFRESH_TOKEN");
    }

    public void revokeToken(UserTable token) {
        // mark as used
        token.setTokenType("USED");
        userTableRepository.save(token);
        // store in revoked tokens table for quick checks
        if (token.getTokenValue() != null) {
            revokedTokenRepository.save(token.getTokenValue(), token.getExpiresAt());
        }
    }

    @Transactional
    public Optional<UserTable> rotateToken(UserTable oldToken, long validityMs) {
        if (oldToken == null) return Optional.empty();
        if (!"REFRESH_TOKEN".equals(oldToken.getTokenType())) return Optional.empty();
        if (oldToken.getExpiresAt() != null && oldToken.getExpiresAt() < System.currentTimeMillis()) return Optional.empty();

        // mark old token as used
        oldToken.setTokenType("USED");
        userTableRepository.save(oldToken);
        if (oldToken.getTokenValue() != null) {
            revokedTokenRepository.save(oldToken.getTokenValue(), oldToken.getExpiresAt());
        }

        // create new refresh token under same PK
        String newValue = UUID.randomUUID().toString();
        UserTable newToken = UserTable.builder()
            .pk(oldToken.getPk())
            .sk("TOKEN#" + UUID.randomUUID().toString())
            .itemType("TOKEN")
            .tokenValue(newValue)
            .tokenType("REFRESH_TOKEN")
            .expiresAt(System.currentTimeMillis() + validityMs)
            .createdAt(System.currentTimeMillis())
            .build();

        userTableRepository.save(newToken);
        return Optional.of(newToken);
    }
}
