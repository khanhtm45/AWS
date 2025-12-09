package com.leafshop.service;

import com.leafshop.dto.user.ChangePasswordRequest;
import com.leafshop.dto.user.UpdateProfileRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.leafshop.dto.user.AddressDto;
import com.leafshop.dto.user.UserProfileResponse;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserTableRepository userTableRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<UserTable> getProfileByUsername(String username) {
        Optional<UserTable> accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) {
            return Optional.empty();
        }
        String pk = accountOpt.get().getPk();
        return userTableRepository.findByPkAndSk(pk, "META");
    }

    public Optional<UserProfileResponse> getProfileDtoByUsername(String username) {
        try {
            log.debug("getProfileDtoByUsername called for username={}", username);
            var accountOpt = userTableRepository.findAccountByUsername(username);
            if (accountOpt.isEmpty()) {
                log.debug("getProfileDtoByUsername: account not found for username={}", username);
                return Optional.empty();
            }
            var account = accountOpt.get();
            String pk = account.getPk();
            log.debug("getProfileDtoByUsername: resolved pk={} for username={}", pk, username);

            Optional<UserTable> metaOpt = userTableRepository.findByPkAndSk(pk, "META");

            List<UserTable> addresses = userTableRepository.findByPkAndSkStartingWith(pk, "ADDRESS#");
            log.debug("getProfileDtoByUsername: found {} address items for pk={}", addresses.size(), pk);
            List<AddressDto> addrDtos = addresses.stream().map(a -> {
                AddressDto dto = new AddressDto();
                // use single `address` field from table
                dto.setAddress(a.getAddress());
                dto.setCity(a.getCity());
                dto.setProvince(a.getProvince());
                dto.setPostalCode(a.getPostalCode());
                dto.setCountry(a.getCountry());
                dto.setIsDefault(a.getIsDefault());
                // id from SK suffix
                String sk = a.getSk();
                if (sk != null && sk.startsWith("ADDRESS#")) {
                    dto.setId(sk.substring("ADDRESS#".length()));
                }
                // map stored first/last name and phone
                dto.setFirstName(a.getAddressFirstName());
                dto.setLastName(a.getAddressLastName());
                dto.setPhone(a.getAddressPhone());
                return dto;
            }).collect(Collectors.toList());

            UserProfileResponse resp = new UserProfileResponse();
            resp.setEmail(account.getEmail());
            if (metaOpt.isPresent()) {
                var meta = metaOpt.get();
                resp.setFirstName(meta.getFirstName());
                resp.setLastName(meta.getLastName());
            }
            resp.setAddresses(addrDtos);

            return Optional.of(resp);
        } catch (Exception e) {
            log.error("Error building profile DTO for username={}", username, e);
            throw e;
        }
    }

    public Optional<UserProfileResponse> getProfileDtoByEmail(String email) {
        try {
            log.debug("getProfileDtoByEmail called for email={}", email);
            var accountOpt = userTableRepository.findAccountByEmail(email);
            if (accountOpt.isEmpty()) {
                log.debug("getProfileDtoByEmail: account not found for email={}", email);
                return Optional.empty();
            }
            var account = accountOpt.get();
            String pk = account.getPk();

            Optional<UserTable> metaOpt = userTableRepository.findByPkAndSk(pk, "META");

            List<UserTable> addresses = userTableRepository.findByPkAndSkStartingWith(pk, "ADDRESS#");
            List<AddressDto> addrDtos = addresses.stream().map(a -> {
                AddressDto dto = new AddressDto();
                dto.setAddress(a.getAddress());
                dto.setCity(a.getCity());
                dto.setProvince(a.getProvince());
                dto.setPostalCode(a.getPostalCode());
                dto.setCountry(a.getCountry());
                dto.setIsDefault(a.getIsDefault());
                String sk = a.getSk();
                if (sk != null && sk.startsWith("ADDRESS#")) {
                    dto.setId(sk.substring("ADDRESS#".length()));
                }
                dto.setFirstName(a.getAddressFirstName());
                dto.setLastName(a.getAddressLastName());
                dto.setPhone(a.getAddressPhone());
                return dto;
            }).collect(Collectors.toList());

            UserProfileResponse resp = new UserProfileResponse();
            resp.setEmail(account.getEmail());
            if (metaOpt.isPresent()) {
                var meta = metaOpt.get();
                resp.setFirstName(meta.getFirstName());
                resp.setLastName(meta.getLastName());
            }
            resp.setAddresses(addrDtos);

            return Optional.of(resp);
        } catch (Exception e) {
            log.error("Error building profile DTO for email={}", email, e);
            throw e;
        }
    }

    public void updateProfile(String username, UpdateProfileRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        String pk = accountOpt.get().getPk();
        Optional<UserTable> metaOpt = userTableRepository.findByPkAndSk(pk, "META");
        if (metaOpt.isEmpty()) {
            throw new RuntimeException("User meta not found");
        }
        UserTable meta = metaOpt.get();
        if (req.getFirstName() != null) {
            meta.setFirstName(req.getFirstName());
        }
        if (req.getLastName() != null) {
            meta.setLastName(req.getLastName());
        }
        meta.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(meta);

        // Persist addresses if provided
        if (req.getAddresses() != null) {
            // existing address items
            List<UserTable> existing = userTableRepository.findByPkAndSkStartingWith(pk, "ADDRESS#");
            java.util.Map<String, UserTable> existingMap = existing.stream()
                    .collect(Collectors.toMap(e -> e.getSk().substring("ADDRESS#".length()), e -> e));

            for (var a : req.getAddresses()) {
                String id = a.getId();
                boolean isNew = false;
                if (id == null || id.isBlank()) {
                    id = String.valueOf(System.currentTimeMillis()) + (int) (Math.random() * 1000);
                    isNew = true;
                }

                UserTable addrItem = new UserTable();
                addrItem.setPk(pk);
                addrItem.setSk("ADDRESS#" + id);
                addrItem.setItemType("ADDRESS");
                addrItem.setAddress(a.getAddress());
                addrItem.setCity(a.getCity());
                addrItem.setProvince(null);
                addrItem.setPostalCode(a.getPostalCode());
                addrItem.setCountry(a.getCountry());
                addrItem.setIsDefault(a.getIsDefault());
                // store contact name and phone
                String contactName = null;
                if (a.getFirstName() != null || a.getLastName() != null) {
                    contactName = (a.getFirstName() == null ? "" : a.getFirstName()) + " " + (a.getLastName() == null ? "" : a.getLastName());
                }
                addrItem.setAddressFirstName(a.getFirstName());
                addrItem.setAddressLastName(a.getLastName());
                addrItem.setAddressPhone(a.getPhone());
                long now = System.currentTimeMillis();
                if (!isNew && existingMap.containsKey(id)) {
                    UserTable prev = existingMap.get(id);
                    addrItem.setCreatedAt(prev.getCreatedAt());
                    existingMap.remove(id);
                } else {
                    addrItem.setCreatedAt(now);
                }
                addrItem.setUpdatedAt(now);

                userTableRepository.save(addrItem);
            }

            // delete remaining addresses that were removed by client
            for (var remaining : existingMap.values()) {
                userTableRepository.delete(remaining);
            }
        }

    }

    /**
     * Add an address for a user identified by username.
     */
    public void addAddressForUsername(String username, com.leafshop.dto.user.CustomerAddressRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        String pk = accountOpt.get().getPk();

        // create address id
        String id = String.valueOf(System.currentTimeMillis()) + (int) (Math.random() * 1000);
        UserTable addrItem = new UserTable();
        addrItem.setPk(pk);
        addrItem.setSk("ADDRESS#" + id);
        addrItem.setItemType("ADDRESS");
        addrItem.setAddress(req.getAddress());
        addrItem.setCity(req.getCity());
        addrItem.setProvince(req.getProvince());
        addrItem.setPostalCode(req.getPostalCode());
        addrItem.setCountry(req.getCountry());
        addrItem.setIsDefault(req.getIsDefault() == null ? false : req.getIsDefault());
        addrItem.setAddressFirstName(req.getAddressFirstName());
        addrItem.setAddressLastName(req.getAddressLastName());
        addrItem.setAddressPhone(req.getAddressPhone());
        long now = System.currentTimeMillis();
        addrItem.setCreatedAt(now);
        addrItem.setUpdatedAt(now);

        userTableRepository.save(addrItem);
    }

    /**
     * Add address for a user verified by email+otp (public flow). Returns true
     * if added.
     */
    public boolean addAddressByEmailOtp(String email, String otp, com.leafshop.dto.user.CustomerAddressRequest req) {
        if (email == null || otp == null) {
            return false;
        }
        String normalized = email.trim().toLowerCase();
        var accOpt = userTableRepository.findAccountByEmail(normalized);
        String expectedPk = accOpt.map(u -> u.getPk()).orElse("EMAIL#" + normalized);

        var tokenOpt = userTableRepository.findTokenByPkValueAndType(expectedPk, otp, "OTP");
        if (tokenOpt.isEmpty()) {
            return false;
        }
        var token = tokenOpt.get();
        if (token.getExpiresAt() == null || token.getExpiresAt() < System.currentTimeMillis()) {
            return false;
        }

        String ownerPk = token.getPk();
        if (ownerPk == null || !ownerPk.startsWith("USER#")) {
            return false;
        }

        // create address id
        String id = String.valueOf(System.currentTimeMillis()) + (int) (Math.random() * 1000);
        UserTable addrItem = new UserTable();
        addrItem.setPk(ownerPk);
        addrItem.setSk("ADDRESS#" + id);
        addrItem.setItemType("ADDRESS");
        addrItem.setAddress(req.getAddress());
        addrItem.setCity(req.getCity());
        addrItem.setProvince(req.getProvince());
        addrItem.setPostalCode(req.getPostalCode());
        addrItem.setCountry(req.getCountry());
        addrItem.setIsDefault(req.getIsDefault() == null ? false : req.getIsDefault());
        addrItem.setAddressFirstName(req.getAddressFirstName());
        addrItem.setAddressLastName(req.getAddressLastName());
        addrItem.setAddressPhone(req.getAddressPhone());
        long now = System.currentTimeMillis();
        addrItem.setCreatedAt(now);
        addrItem.setUpdatedAt(now);

        userTableRepository.save(addrItem);

        // mark token used
        token.setTokenType("USED");
        userTableRepository.save(token);
        return true;
    }

    public void changePassword(String username, ChangePasswordRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        UserTable account = accountOpt.get();
        if (!passwordEncoder.matches(req.getOldPassword(), account.getPassword())) {
            throw new RuntimeException("Old password incorrect");
        }
        account.setPassword(passwordEncoder.encode(req.getNewPassword()));
        account.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(account);
    }

    /**
     * Update profile (firstName, lastName) for a customer using an OTP tied to
     * their email. Returns true if update succeeded.
     */
    public boolean updateProfileByEmailOtp(String email, String firstName, String lastName, String otp) {
        if (email == null || otp == null) {
            return false;
        }
        String normalized = email.trim().toLowerCase();
        // resolve expected PK for token lookup
        var accOpt = userTableRepository.findAccountByEmail(normalized);
        String expectedPk = accOpt.map(u -> u.getPk()).orElse("EMAIL#" + normalized);

        var tokenOpt = userTableRepository.findTokenByPkValueAndType(expectedPk, otp, "OTP");
        if (tokenOpt.isEmpty()) {
            return false;
        }
        var token = tokenOpt.get();
        if (token.getExpiresAt() == null || token.getExpiresAt() < System.currentTimeMillis()) {
            return false;
        }

        // token owner PK must be a user
        String ownerPk = token.getPk();
        if (ownerPk == null || !ownerPk.startsWith("USER#")) {
            return false;
        }

        // find meta record
        Optional<UserTable> metaOpt = userTableRepository.findByPkAndSk(ownerPk, "META");
        if (metaOpt.isEmpty()) {
            return false;
        }
        UserTable meta = metaOpt.get();
        if (firstName != null) {
            meta.setFirstName(firstName);
        }
        if (lastName != null) {
            meta.setLastName(lastName);
        }
        meta.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(meta);

        // mark token used
        token.setTokenType("USED");
        userTableRepository.save(token);

        return true;
    }
}
