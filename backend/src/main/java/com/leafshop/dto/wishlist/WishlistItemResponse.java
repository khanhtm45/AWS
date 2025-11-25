package com.leafshop.dto.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItemResponse {
    private String wishlistId;
    private String userId;
    private String productId;
    private Long dateAdded;
    private String notes;
    private Integer priority;
    private String category;
    private Double price;
}
