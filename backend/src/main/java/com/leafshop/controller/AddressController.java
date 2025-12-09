package com.leafshop.controller;

import com.leafshop.dto.address.AddressRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    public ResponseEntity<UserTable> addAddress(@AuthenticationPrincipal UserDetails user, @Valid @RequestBody AddressRequest req) {
        UserTable addr = addressService.addAddress(user.getUsername(), req);
        return ResponseEntity.ok(addr);
    }

    @GetMapping
    public ResponseEntity<List<UserTable>> list(@AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            return ResponseEntity.ok(List.of()); // Return empty list if not authenticated
        }
        return ResponseEntity.ok(addressService.listAddresses(user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal UserDetails user, @PathVariable("id") String id) {
        addressService.deleteAddress(user.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/default")
    public ResponseEntity<?> setDefault(@AuthenticationPrincipal UserDetails user, @PathVariable("id") String id) {
        addressService.setDefault(user.getUsername(), id);
        return ResponseEntity.ok().build();
    }
}
