package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "transaction_id", unique = true, length = 255)
    private String transactionId; // ID giao dịch từ cổng thanh toán

    @Column(nullable = false, precision = 10, scale = 2)
    private Double amount;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod; // 'Credit Card', 'Bank Transfer', 'COD', 'Momo'

    @Column(name = "payment_date", nullable = false, updatable = false)
    private LocalDateTime paymentDate;

    @Column(nullable = false, length = 50)
    private String status; // 'Success', 'Failed', 'Pending', 'Refunded'

    @PrePersist
    protected void onCreate() {
        paymentDate = LocalDateTime.now();
        if (status == null) {
            status = "Pending";
        }
    }
}


