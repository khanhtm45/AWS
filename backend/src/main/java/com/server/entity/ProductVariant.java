package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "product_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_id")
    private Long variantId;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "attribute_name", nullable = false, length = 100)
    private String attributeName; // 'Color', 'Size'

    @Column(name = "attribute_value", nullable = false, length = 100)
    private String attributeValue; // 'Red', 'XL'

    @Column(name = "price_adjustment", nullable = false, precision = 10, scale = 2)
    private Double priceAdjustment = 0.00; // Điều chỉnh giá so với giá gốc sản phẩm

    @Column(name = "sku_variant", unique = true, length = 50)
    private String skuVariant;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "productVariant")
    private Set<WarehouseProductInventory> inventories;

    @OneToMany(mappedBy = "variant")
    private Set<CartItem> cartItems;

    @OneToMany(mappedBy = "variant")
    private Set<OrderItem> orderItems;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}


