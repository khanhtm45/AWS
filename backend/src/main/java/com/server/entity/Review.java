package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer rating; // Từ 1 đến 5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "review_date", nullable = false, updatable = false)
    private LocalDateTime reviewDate;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false; // Cần quản trị viên duyệt

    @PrePersist
    protected void onCreate() {
        reviewDate = LocalDateTime.now();
    }
}


