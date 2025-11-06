package com.server.controller;

import com.server.entity.Warehouse;
import com.server.entity.WarehouseProductInventory;
import com.server.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class InventoryAdminController {

    private final InventoryService inventoryService;

    public InventoryAdminController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // Warehouses
    @PostMapping("/warehouses")
    public Warehouse createWarehouse(@RequestBody Warehouse warehouse) { return inventoryService.createWarehouse(warehouse); }

    @GetMapping("/warehouses")
    public List<Warehouse> listWarehouses() { return inventoryService.listWarehouses(); }

    @PutMapping("/warehouses/{id}")
    public Warehouse updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) { return inventoryService.updateWarehouse(id, warehouse); }

    @DeleteMapping("/warehouses/{id}")
    public void deleteWarehouse(@PathVariable Long id) { inventoryService.deleteWarehouse(id); }

    // Inventory
    @PostMapping("/inventory")
    public WarehouseProductInventory setInventory(@RequestBody WarehouseProductInventory inv) { return inventoryService.setInventory(inv); }

    @GetMapping("/warehouses/{id}/inventory")
    public List<WarehouseProductInventory> listWarehouseInventory(@PathVariable Long id) { return inventoryService.listInventoryByWarehouse(id); }
}


