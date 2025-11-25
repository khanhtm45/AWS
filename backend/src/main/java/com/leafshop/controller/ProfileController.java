package com.leafshop.controller;

import com.leafshop.dto.user.ChangePasswordRequest;
import com.leafshop.dto.user.UpdateProfileRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails user) {
        Optional<UserTable> meta = userService.getProfileByUsername(user.getUsername());
        return ResponseEntity.of(meta);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails user, @Valid @RequestBody UpdateProfileRequest req) {
        userService.updateProfile(user.getUsername(), req);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails user, @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(user.getUsername(), req);
        return ResponseEntity.ok().build();
    }
}
