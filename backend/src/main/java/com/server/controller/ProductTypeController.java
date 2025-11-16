package com.server.controller;

import com.server.dto.producttype.ProductTypeRequest;
import com.server.dto.producttype.ProductTypeResponse;
import com.server.service.ProductTypeService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/product-types")
@Validated
@RequiredArgsConstructor
public class ProductTypeController {

	private final ProductTypeService productTypeService;

	@PostMapping
	public ResponseEntity<ProductTypeResponse> createProductType(@Valid @RequestBody ProductTypeRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productTypeService.createProductType(request));
	}

	@PutMapping("/{typeId}")
	public ResponseEntity<ProductTypeResponse> updateProductType(
		@PathVariable String typeId,
		@Valid @RequestBody ProductTypeRequest request
	) {
		return ResponseEntity.ok(productTypeService.updateProductType(typeId, request));
	}

	@GetMapping("/{typeId}")
	public ResponseEntity<ProductTypeResponse> getProductType(@PathVariable String typeId) {
		return ResponseEntity.ok(productTypeService.getProductType(typeId));
	}

	@GetMapping
	public ResponseEntity<List<ProductTypeResponse>> listProductTypes() {
		return ResponseEntity.ok(productTypeService.listProductTypes());
	}

	@DeleteMapping("/{typeId}")
	public ResponseEntity<Void> deleteProductType(@PathVariable String typeId) {
		productTypeService.deleteProductType(typeId);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}

