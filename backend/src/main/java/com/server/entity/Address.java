package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long addressId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "address_line1", nullable = false, length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "state_province", length = 100)
    private String stateProvince;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Column(nullable = false, length = 100)
    private String country = "Vietnam";

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "address_type", length = 50)
    private String addressType; // 'Shipping', 'Billing', 'Home'

    @OneToMany(mappedBy = "shippingAddress")
    private java.util.Set<Order> shippingOrders;

    @OneToMany(mappedBy = "billingAddress")
    private java.util.Set<Order> billingOrders;
}


