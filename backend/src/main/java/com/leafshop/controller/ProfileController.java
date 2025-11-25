package com.leafshop.controller;

import com.leafshop.dto.user.ChangePasswordRequest;
import com.leafshop.dto.user.UpdateProfileRequest;
import com.leafshop.dto.user.UserProfileResponse;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails user, Principal principal) {
        log.debug("getProfile called. principal: {}, rawPrincipal: {}", user, principal);
        // If no authenticated principal, return 401 instead of throwing NPE
        if (user == null || principal == null) {
            log.debug("getProfile: no authenticated principal, returning 401");
            return ResponseEntity.status(401).body("Unauthenticated");
        }
        Optional<UserProfileResponse> profile = userService.getProfileDtoByUsername(user.getUsername());
        log.debug("getProfile result present={} for username={}", profile.isPresent(), user.getUsername());
        return ResponseEntity.of(profile);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails user, Principal principal, @Valid @RequestBody UpdateProfileRequest req) {
        if (user == null || principal == null) return ResponseEntity.status(401).body("Unauthenticated");
        userService.updateProfile(user.getUsername(), req);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails user, Principal principal, @Valid @RequestBody ChangePasswordRequest req) {
        if (user == null || principal == null) return ResponseEntity.status(401).body("Unauthenticated");
        userService.changePassword(user.getUsername(), req);
        return ResponseEntity.ok().build();
    }
}
