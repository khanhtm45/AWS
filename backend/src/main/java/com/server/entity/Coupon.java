package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "coupon_id")
    private Long couponId;

    @Column(name = "coupon_code", nullable = false, unique = true, length = 50)
    private String couponCode;

    @Column(name = "discount_type", nullable = false, length = 50)
    private String discountType; // 'Percentage', 'Fixed Amount', 'Free Shipping'

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private Double discountValue;

    @Column(name = "min_order_amount", nullable = false, precision = 10, scale = 2)
    private Double minOrderAmount = 0.00;

    @Column(name = "usage_limit")
    private Integer usageLimit; // Số lần sử dụng tối đa

    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "coupon")
    private Set<OrderCoupon> orderCoupons;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}


