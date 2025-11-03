package com.server.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Entity
@Table(name = "product_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "type_id")
    private Long typeId;

    @Column(name = "type_name", nullable = false, unique = true, length = 100)
    private String typeName; // "Digital", "Physical", "Service"

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "productType")
    private Set<Product> products;
}


