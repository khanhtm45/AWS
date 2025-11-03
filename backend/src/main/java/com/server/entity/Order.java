package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "shipping_address_id", nullable = false)
    private Address shippingAddress;

    @ManyToOne
    @JoinColumn(name = "billing_address_id")
    private Address billingAddress;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private Double totalAmount;

    @Column(name = "shipping_cost", nullable = false, precision = 10, scale = 2)
    private Double shippingCost = 0.00;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private Double discountAmount = 0.00;

    @Column(name = "order_status", nullable = false, length = 50)
    private String orderStatus; // 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Preorder Confirmed'

    @Column(name = "payment_status", nullable = false, length = 50)
    private String paymentStatus; // 'Pending', 'Paid', 'Refunded', 'Failed'

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "order_date", nullable = false, updatable = false)
    private LocalDateTime orderDate;

    @Column(name = "estimated_delivery_date")
    private LocalDateTime estimatedDeliveryDate; // Ngày giao hàng dự kiến (có thể từ sản phẩm preorder)

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "staff_confirm_id")
    private EmployeeDetails staffConfirm; // Nhân viên xác nhận

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse; // Kho xuất hàng

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<OrderItem> orderItems;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<Payment> payments;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<OrderCoupon> orderCoupons;

    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (orderStatus == null) {
            orderStatus = "Pending";
        }
        if (paymentStatus == null) {
            paymentStatus = "Pending";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


