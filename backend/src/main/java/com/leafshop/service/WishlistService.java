package com.leafshop.service;

import com.leafshop.dto.wishlist.AddToWishlistRequest;
import com.leafshop.dto.wishlist.WishlistItemResponse;
import com.leafshop.dto.wishlist.WishlistResponse;
import com.leafshop.model.dynamodb.WishlistTable;
import com.leafshop.repository.WishlistTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistTableRepository wishlistRepository;

    // Add product to wishlist
    public WishlistItemResponse addToWishlist(AddToWishlistRequest request) {
        // Check if product already in wishlist
        if (wishlistRepository.existsByUserIdAndProductId(request.getUserId(), request.getProductId())) {
            throw new IllegalArgumentException("Product already in wishlist");
        }

        String wishlistId = UUID.randomUUID().toString();

        WishlistTable wishlist = WishlistTable.builder()
                .wishlistId(wishlistId)
                .userId(request.getUserId())
                .productId(request.getProductId())
                .dateAdded(System.currentTimeMillis())
                .notes(request.getNotes())
                .priority(request.getPriority() != null ? request.getPriority() : 2)
                .build();

        WishlistTable saved = wishlistRepository.save(wishlist);
        return mapToResponse(saved);
    }

    // Get all wishlist items for a user
    public WishlistResponse getWishlist(String userId) {
        List<WishlistTable> items = wishlistRepository.findByUserId(userId);
        
        List<WishlistItemResponse> responses = items.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return WishlistResponse.builder()
                .userId(userId)
                .items(responses)
                .totalItems(responses.size())
                .build();
    }

    // Remove from wishlist
    public void removeFromWishlist(String wishlistId, String userId) {
        WishlistTable item = wishlistRepository.findById(wishlistId, userId);
        if (item == null) {
            throw new IllegalArgumentException("Wishlist item not found");
        }
        wishlistRepository.deleteById(wishlistId, userId);
    }

    // Remove product from wishlist by product ID
    public void removeProductFromWishlist(String userId, String productId) {
        List<WishlistTable> items = wishlistRepository.findByUserId(userId);
        items.stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .ifPresent(item -> wishlistRepository.deleteById(item.getWishlistId(), userId));
    }

    // Check if product is in wishlist
    public boolean isInWishlist(String userId, String productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    // Clear entire wishlist
    public void clearWishlist(String userId) {
        wishlistRepository.deleteByUserId(userId);
    }

    private WishlistItemResponse mapToResponse(WishlistTable wishlist) {
        return WishlistItemResponse.builder()
                .wishlistId(wishlist.getWishlistId())
                .userId(wishlist.getUserId())
                .productId(wishlist.getProductId())
                .dateAdded(wishlist.getDateAdded())
                .notes(wishlist.getNotes())
                .priority(wishlist.getPriority())
                .category(wishlist.getCategory())
                .price(wishlist.getPrice())
                .build();
    }
}
