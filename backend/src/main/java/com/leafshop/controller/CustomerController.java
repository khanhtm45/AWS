package com.leafshop.controller;

import com.leafshop.dto.user.UserProfileResponse;
import com.leafshop.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final UserService userService;
    private final com.leafshop.repository.UserTableRepository userTableRepository;

    /**
     * Public endpoint to fetch a customer's profile and addresses by email.
     * This is useful for customers that authenticate via email+OTP.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfileByEmail(@RequestParam("email") String email) {
        if (email == null || email.isBlank()) return ResponseEntity.badRequest().body("email required");
        Optional<UserProfileResponse> profile = userService.getProfileDtoByEmail(email.trim().toLowerCase());
        return ResponseEntity.of(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfileByCustomer(@RequestBody com.leafshop.dto.user.CustomerUpdateRequest req, @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails user) {
        // Only allow updating firstName and lastName through this endpoint
        if (req.getFirstName() == null && req.getLastName() == null) {
            return ResponseEntity.badRequest().body("Provide firstName or lastName to update");
        }

        if (user != null) {
            // Authenticated flow - apply only firstName/lastName
            com.leafshop.dto.user.UpdateProfileRequest upr = new com.leafshop.dto.user.UpdateProfileRequest();
            upr.setFirstName(req.getFirstName());
            upr.setLastName(req.getLastName());
            userService.updateProfile(user.getUsername(), upr);
            return ResponseEntity.ok().build();
        }

        // Public flow using email + otp - require both
        if (req.getEmail() == null || req.getEmail().isBlank() || req.getOtp() == null || req.getOtp().isBlank()) {
            return ResponseEntity.badRequest().body("email and otp required for public update");
        }
        boolean ok = userService.updateProfileByEmailOtp(req.getEmail().trim().toLowerCase(), req.getFirstName(), req.getLastName(), req.getOtp());
        if (!ok) return ResponseEntity.status(401).body("Invalid otp or account");
        return ResponseEntity.ok().build();
    }

    /**
     * Confirm email change for an authenticated user.
     * Verifies OTP that was sent to the new email (token stored under PK = EMAIL#<email>)
     * and updates the ACCOUNT item for the authenticated user.
     */
    @PostMapping("/profile/confirm-email-change")
    public ResponseEntity<?> confirmEmailChange(@RequestBody com.leafshop.dto.user.CustomerUpdateRequest req, @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails user) {
        if (user == null) return ResponseEntity.status(401).body("Unauthenticated");
        if (req.getEmail() == null || req.getEmail().isBlank() || req.getOtp() == null || req.getOtp().isBlank()) {
            return ResponseEntity.badRequest().body("email and otp required");
        }

        String normalized = req.getEmail().trim().toLowerCase();
        String tokenPk = "EMAIL#" + normalized;

        var tokenOpt = userTableRepository.findTokenByPkValueAndType(tokenPk, req.getOtp(), "OTP");
        if (tokenOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid or expired OTP");
        var token = tokenOpt.get();
        if (token.getExpiresAt() == null || token.getExpiresAt() < System.currentTimeMillis()) return ResponseEntity.status(401).body("Invalid or expired OTP");

        // update account email for authenticated user
        var accountOpt = userTableRepository.findAccountByUsername(user.getUsername());
        if (accountOpt.isEmpty()) return ResponseEntity.status(401).body("Account not found");
        var account = accountOpt.get();
        account.setEmail(normalized);
        account.setUpdatedAt(System.currentTimeMillis());
        userTableRepository.save(account);

        // mark token used
        token.setTokenType("USED");
        userTableRepository.save(token);

        return ResponseEntity.ok().build();
    }

    /**
     * Add address for customer. Supports authenticated users and public email+OTP flow.
     */
    @PostMapping("/address")
    public ResponseEntity<?> addAddress(@RequestBody com.leafshop.dto.user.CustomerAddressRequest req, @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails user) {
        // Validate required address fields
        if (req.getAddress() == null || req.getAddress().isBlank()) return ResponseEntity.badRequest().body("address required");

        try {
            if (user != null) {
                // Authenticated: add address under user's account
                userService.addAddressForUsername(user.getUsername(), req);
                return ResponseEntity.ok().build();
            }

            // Public flow: require email + otp
            if (req.getEmail() == null || req.getEmail().isBlank() || req.getOtp() == null || req.getOtp().isBlank()) {
                return ResponseEntity.badRequest().body("email and otp required for public add");
            }
            boolean ok = userService.addAddressByEmailOtp(req.getEmail().trim().toLowerCase(), req.getOtp(), req);
            if (!ok) return ResponseEntity.status(401).body("Invalid otp or account");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error adding address", e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

}
