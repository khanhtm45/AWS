package com.server.controller;

import com.server.dto.productvariant.ProductVariantRequest;
import com.server.dto.productvariant.ProductVariantResponse;
import com.server.service.ProductVariantService;
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
@RequestMapping("/api/products/{productId}/variants")
@Validated
@RequiredArgsConstructor
public class ProductVariantController {

	private final ProductVariantService productVariantService;

	@PostMapping
	public ResponseEntity<ProductVariantResponse> createProductVariant(
		@PathVariable String productId,
		@Valid @RequestBody ProductVariantRequest request
	) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productVariantService.createProductVariant(productId, request));
	}

	@PutMapping("/{variantId}")
	public ResponseEntity<ProductVariantResponse> updateProductVariant(
		@PathVariable String productId,
		@PathVariable String variantId,
		@Valid @RequestBody ProductVariantRequest request
	) {
		return ResponseEntity.ok(productVariantService.updateProductVariant(productId, variantId, request));
	}

	@GetMapping("/{variantId}")
	public ResponseEntity<ProductVariantResponse> getProductVariant(
		@PathVariable String productId,
		@PathVariable String variantId
	) {
		return ResponseEntity.ok(productVariantService.getProductVariant(productId, variantId));
	}

	@GetMapping
	public ResponseEntity<List<ProductVariantResponse>> listProductVariants(@PathVariable String productId) {
		return ResponseEntity.ok(productVariantService.listProductVariants(productId));
	}

	@DeleteMapping("/{variantId}")
	public ResponseEntity<Void> deleteProductVariant(
		@PathVariable String productId,
		@PathVariable String variantId
	) {
		productVariantService.deleteProductVariant(productId, variantId);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}

