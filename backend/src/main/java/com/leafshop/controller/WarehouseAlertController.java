package com.leafshop.controller;

import com.leafshop.dto.warehouse.LowStockAlertResponse;
import com.leafshop.service.WarehouseInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses/alerts")
@RequiredArgsConstructor
public class WarehouseAlertController {

	private final WarehouseInventoryService warehouseInventoryService;

	@GetMapping
	public ResponseEntity<List<LowStockAlertResponse>> getAllLowStockAlerts() {
		return ResponseEntity.ok(warehouseInventoryService.getAllLowStockAlerts());
	}
}


