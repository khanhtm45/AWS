package com.leafshop.controller;

import com.leafshop.dto.product.ProductRequest;
import com.leafshop.dto.product.ProductResponse;
import com.leafshop.service.ProductService;
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
@RequestMapping("/api/products")
@Validated
@RequiredArgsConstructor
public class ProductController {

	private final ProductService productService;

	@PostMapping
	public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
	}

	@PutMapping("/{productId}")
	public ResponseEntity<ProductResponse> updateProduct(
		@PathVariable String productId,
		@Valid @RequestBody ProductRequest request
	) {
		return ResponseEntity.ok(productService.updateProduct(productId, request));
	}

	@GetMapping("/{productId}")
	public ResponseEntity<ProductResponse> getProduct(@PathVariable String productId) {
		return ResponseEntity.ok(productService.getProduct(productId));
	}

	@GetMapping
	public ResponseEntity<List<ProductResponse>> listProducts(
		@RequestParam(required = false) String categoryId,
		@RequestParam(required = false) String typeId,
		@RequestParam(required = false) Boolean isActive
	) {
		return ResponseEntity.ok(productService.listProducts(categoryId, typeId, isActive));
	}

	@DeleteMapping("/{productId}")
	public ResponseEntity<Void> deleteProduct(@PathVariable String productId) {
		productService.deleteProduct(productId);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}


