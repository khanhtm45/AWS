package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Long orderItemId;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product; // Một trong product_id hoặc variant_id phải có giá trị

    @ManyToOne
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private Double unitPrice; // Giá sản phẩm tại thời điểm đặt hàng

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private Double totalPrice; // quantity * unit_price

    @Column(name = "is_preorder_item", nullable = false)
    private Boolean isPreorderItem = false; // Xác định đây có phải mặt hàng preorder không
}


