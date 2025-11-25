package com.leafshop.controller;

import com.leafshop.dto.customer.CustomerProductResponse;
import com.leafshop.dto.customer.PaginatedResponse;
import com.leafshop.service.CustomerProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/products")
@RequiredArgsConstructor
public class CustomerProductController {

	private final CustomerProductService customerProductService;

	@GetMapping
	public ResponseEntity<PaginatedResponse<CustomerProductResponse>> searchProducts(
		@RequestParam(required = false) String keyword,
		@RequestParam(required = false) String categoryId,
		@RequestParam(required = false) String typeId,
		@RequestParam(required = false) Double minPrice,
		@RequestParam(required = false) Double maxPrice,
		@RequestParam(required = false) String size,
		@RequestParam(required = false) String color,
		@RequestParam(required = false, defaultValue = "newest") String sortBy,
		@RequestParam(required = false, defaultValue = "0") int page,
		@RequestParam(required = false, defaultValue = "20") int pageSize
	) {
		return ResponseEntity.ok(customerProductService.searchProducts(
			keyword, categoryId, typeId, minPrice, maxPrice, size, color, sortBy, page, pageSize
		));
	}

	@GetMapping("/{productId}")
	public ResponseEntity<CustomerProductResponse> getProductDetail(@PathVariable String productId) {
		return ResponseEntity.ok(customerProductService.getProductDetail(productId));
	}

	@GetMapping("/{productId}/related")
	public ResponseEntity<List<CustomerProductResponse>> getRelatedProducts(
		@PathVariable String productId,
		@RequestParam(required = false, defaultValue = "10") int limit
	) {
		return ResponseEntity.ok(customerProductService.getRelatedProducts(productId, limit));
	}
}


