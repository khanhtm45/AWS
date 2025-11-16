package com.server.controller;

import com.server.dto.warehouse.LowStockAlertResponse;
import com.server.dto.warehouse.UpdateInventoryRequest;
import com.server.dto.warehouse.WarehouseInventoryRequest;
import com.server.dto.warehouse.WarehouseInventoryResponse;
import com.server.service.WarehouseInventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses/{warehouseId}/inventory")
@Validated
@RequiredArgsConstructor
public class WarehouseInventoryController {

	private final WarehouseInventoryService warehouseInventoryService;

	@PostMapping
	public ResponseEntity<WarehouseInventoryResponse> createInventory(
		@PathVariable String warehouseId,
		@Valid @RequestBody WarehouseInventoryRequest request
	) {
		return ResponseEntity.status(HttpStatus.CREATED).body(warehouseInventoryService.createInventory(warehouseId, request));
	}

	@PutMapping("/products/{productId}")
	public ResponseEntity<WarehouseInventoryResponse> updateInventory(
		@PathVariable String warehouseId,
		@PathVariable String productId,
		@RequestParam(required = false) String variantId,
		@Valid @RequestBody WarehouseInventoryRequest request
	) {
		return ResponseEntity.ok(warehouseInventoryService.updateInventory(warehouseId, productId, variantId, request));
	}

	@GetMapping("/products/{productId}")
	public ResponseEntity<WarehouseInventoryResponse> getInventory(
		@PathVariable String warehouseId,
		@PathVariable String productId,
		@RequestParam(required = false) String variantId
	) {
		return ResponseEntity.ok(warehouseInventoryService.getInventory(warehouseId, productId, variantId));
	}

	@GetMapping
	public ResponseEntity<List<WarehouseInventoryResponse>> listInventory(
		@PathVariable String warehouseId,
		@RequestParam(required = false) String productId
	) {
		return ResponseEntity.ok(warehouseInventoryService.listInventory(warehouseId, productId));
	}

	@DeleteMapping("/products/{productId}")
	public ResponseEntity<Void> deleteInventory(
		@PathVariable String warehouseId,
		@PathVariable String productId,
		@RequestParam(required = false) String variantId
	) {
		warehouseInventoryService.deleteInventory(warehouseId, productId, variantId);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/update")
	public ResponseEntity<WarehouseInventoryResponse> updateInventoryQuantity(
		@Valid @RequestBody UpdateInventoryRequest request
	) {
		return ResponseEntity.ok(warehouseInventoryService.updateInventoryQuantity(request));
	}

	@GetMapping("/alerts")
	public ResponseEntity<LowStockAlertResponse> getLowStockAlerts(@PathVariable String warehouseId) {
		return ResponseEntity.ok(warehouseInventoryService.getLowStockAlerts(warehouseId));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}

