package com.server.repository;

import com.server.entity.Product;
import com.server.entity.ProductVariant;
import com.server.entity.Warehouse;
import com.server.entity.WarehouseProductInventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WarehouseProductInventoryRepository extends JpaRepository<WarehouseProductInventory, Long> {
    List<WarehouseProductInventory> findByWarehouse(Warehouse warehouse);
    List<WarehouseProductInventory> findByProduct(Product product);
    List<WarehouseProductInventory> findByVariant(ProductVariant variant);
    Optional<WarehouseProductInventory> findByWarehouseAndVariant(Warehouse warehouse, ProductVariant variant);
}


