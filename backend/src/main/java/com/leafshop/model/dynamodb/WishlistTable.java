package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistTable {
    private String wishlistId;      // PK: Wishlist Item ID
    private String userId;          // SK: User ID
    private String productId;       // Product ID
    private Long dateAdded;         // When product was added
    private String notes;           // Customer notes
    private Integer priority;       // Priority (1=high, 2=medium, 3=low)
    private String category;        // Product category
    private Double price;           // Product price at time of adding

    public static WishlistTable fromMap(Map<String, AttributeValue> item) {
        if (item == null || item.isEmpty()) {
            return null;
        }

        return WishlistTable.builder()
                .wishlistId(item.containsKey("wishlistId") ? item.get("wishlistId").s() : null)
                .userId(item.containsKey("userId") ? item.get("userId").s() : null)
                .productId(item.containsKey("productId") ? item.get("productId").s() : null)
                .dateAdded(item.containsKey("dateAdded") ? Long.parseLong(item.get("dateAdded").n()) : null)
                .notes(item.containsKey("notes") ? item.get("notes").s() : null)
                .priority(item.containsKey("priority") ? Integer.parseInt(item.get("priority").n()) : 2)
                .category(item.containsKey("category") ? item.get("category").s() : null)
                .price(item.containsKey("price") ? Double.parseDouble(item.get("price").n()) : null)
                .build();
    }

    public static Map<String, AttributeValue> toMap(WishlistTable wishlist) {
        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("wishlistId", AttributeValue.builder().s(wishlist.getWishlistId()).build());
        item.put("userId", AttributeValue.builder().s(wishlist.getUserId()).build());
        item.put("productId", AttributeValue.builder().s(wishlist.getProductId()).build());
        item.put("dateAdded", AttributeValue.builder().n(String.valueOf(wishlist.getDateAdded())).build());
        if (wishlist.getNotes() != null) {
            item.put("notes", AttributeValue.builder().s(wishlist.getNotes()).build());
        }
        item.put("priority", AttributeValue.builder().n(String.valueOf(wishlist.getPriority())).build());
        if (wishlist.getCategory() != null) {
            item.put("category", AttributeValue.builder().s(wishlist.getCategory()).build());
        }
        if (wishlist.getPrice() != null) {
            item.put("price", AttributeValue.builder().n(String.valueOf(wishlist.getPrice())).build());
        }
        return item;
    }
}
