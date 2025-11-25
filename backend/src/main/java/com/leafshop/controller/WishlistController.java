package com.leafshop.controller;

import com.leafshop.dto.wishlist.AddToWishlistRequest;
import com.leafshop.dto.wishlist.WishlistItemResponse;
import com.leafshop.dto.wishlist.WishlistResponse;
import com.leafshop.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    // 1. Thêm sản phẩm vào wishlist
    @PostMapping
    public ResponseEntity<WishlistItemResponse> addToWishlist(@RequestBody AddToWishlistRequest request) {
        try {
            WishlistItemResponse response = wishlistService.addToWishlist(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 2. Lấy danh sách wishlist của người dùng
    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(@RequestParam String userId) {
        try {
            WishlistResponse response = wishlistService.getWishlist(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // 3. Xoá sản phẩm khỏi wishlist
    @DeleteMapping("/{wishlistId}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable String wishlistId,
                                                   @RequestParam String userId) {
        try {
            wishlistService.removeFromWishlist(wishlistId, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

