package com.server.service;

import com.server.entity.*;
import com.server.repository.WarehouseProductInventoryRepository;
import com.server.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InventoryService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseProductInventoryRepository inventoryRepository;

    public InventoryService(WarehouseRepository warehouseRepository,
                            WarehouseProductInventoryRepository inventoryRepository) {
        this.warehouseRepository = warehouseRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public Warehouse createWarehouse(Warehouse warehouse) { return warehouseRepository.save(warehouse); }
    public Warehouse getWarehouse(Long id) { return warehouseRepository.findById(id).orElseThrow(); }
    public List<Warehouse> listWarehouses() { return warehouseRepository.findAll(); }
    public Warehouse updateWarehouse(Long id, Warehouse data) {
        Warehouse w = getWarehouse(id);
        w.setName(data.getName());
        w.setAddress(data.getAddress());
        return warehouseRepository.save(w);
    }
    public void deleteWarehouse(Long id) { warehouseRepository.deleteById(id); }

    public WarehouseProductInventory setInventory(WarehouseProductInventory inv) {
        return inventoryRepository.save(inv);
    }

    public List<WarehouseProductInventory> listInventoryByWarehouse(Long warehouseId) {
        Warehouse w = getWarehouse(warehouseId);
        return inventoryRepository.findByWarehouse(w);
    }
}


