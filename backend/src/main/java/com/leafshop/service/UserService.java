package com.leafshop.service;

import com.leafshop.dto.user.ChangePasswordRequest;
import com.leafshop.dto.user.UpdateProfileRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserTableRepository userTableRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<UserTable> getProfileByUsername(String username) {
        Optional<UserTable> accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) return Optional.empty();
        String pk = accountOpt.get().getPk();
        return userTableRepository.findByPkAndSk(pk, "META");
    }

    public void updateProfile(String username, UpdateProfileRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) throw new RuntimeException("User not found");
        String pk = accountOpt.get().getPk();
        Optional<UserTable> metaOpt = userTableRepository.findByPkAndSk(pk, "META");
        if (metaOpt.isEmpty()) throw new RuntimeException("User meta not found");
        UserTable meta = metaOpt.get();
        if (req.getFirstName() != null) meta.setFirstName(req.getFirstName());
        if (req.getLastName() != null) meta.setLastName(req.getLastName());
        if (req.getPhoneNumber() != null) meta.setPhoneNumber(req.getPhoneNumber());
        if (req.getNationalId() != null) meta.setNationalId(req.getNationalId());
        meta.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(meta);
    }

    public void changePassword(String username, ChangePasswordRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) throw new RuntimeException("User not found");
        UserTable account = accountOpt.get();
        if (!passwordEncoder.matches(req.getOldPassword(), account.getPassword())) {
            throw new RuntimeException("Old password incorrect");
        }
        account.setPassword(passwordEncoder.encode(req.getNewPassword()));
        account.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(account);
    }
}
