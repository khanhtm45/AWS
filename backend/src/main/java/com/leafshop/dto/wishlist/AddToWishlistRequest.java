package com.leafshop.dto.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddToWishlistRequest {
    private String userId;          // User ID
    private String productId;       // Product ID to add
    private String notes;           // Optional notes
    private Integer priority;       // 1=high, 2=medium, 3=low (default: 2)
}
