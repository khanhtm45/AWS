package com.leafshop.controller;

import com.leafshop.dto.warehouse.WarehouseRequest;
import com.leafshop.dto.warehouse.WarehouseResponse;
import com.leafshop.service.WarehouseService;
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
@RequestMapping("/api/warehouses")
@Validated
@RequiredArgsConstructor
public class WarehouseController {

	private final WarehouseService warehouseService;

	@PostMapping
	public ResponseEntity<WarehouseResponse> createWarehouse(@Valid @RequestBody WarehouseRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.createWarehouse(request));
	}

	@PutMapping("/{warehouseId}")
	public ResponseEntity<WarehouseResponse> updateWarehouse(
		@PathVariable String warehouseId,
		@Valid @RequestBody WarehouseRequest request
	) {
		return ResponseEntity.ok(warehouseService.updateWarehouse(warehouseId, request));
	}

	@GetMapping("/{warehouseId}")
	public ResponseEntity<WarehouseResponse> getWarehouse(@PathVariable String warehouseId) {
		return ResponseEntity.ok(warehouseService.getWarehouse(warehouseId));
	}

	@GetMapping
	public ResponseEntity<List<WarehouseResponse>> listWarehouses(
		@RequestParam(required = false) Boolean isActive
	) {
		return ResponseEntity.ok(warehouseService.listWarehouses(isActive));
	}

	@DeleteMapping("/{warehouseId}")
	public ResponseEntity<Void> deleteWarehouse(@PathVariable String warehouseId) {
		warehouseService.deleteWarehouse(warehouseId);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}


