package com.leafshop.service;

import com.leafshop.auth.JwtUtil;
import com.leafshop.dto.auth.AuthResponse;
import com.leafshop.dto.auth.LoginRequest;
import com.leafshop.dto.auth.RegisterRequest;
import com.leafshop.model.dynamodb.UserTable;
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

        // ACCOUNT item
        UserTable account = UserTable.builder()
            .pk(pk)
            .sk("ACCOUNT")
            .itemType("ACCOUNT")
            .username(req.getUsername())
            .email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .role("USER")
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
        if (accountOpt.isEmpty()) throw new RuntimeException("Invalid credentials");
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
}
