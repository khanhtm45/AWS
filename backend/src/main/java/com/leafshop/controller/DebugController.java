package com.leafshop.controller;

import com.leafshop.model.dynamodb.ProductTable;
import com.leafshop.repository.ProductTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Debug controller để kiểm tra database
 */
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

	private final ProductTableRepository productTableRepository;

	@GetMapping("/products/all")
	public ResponseEntity<Map<String, Object>> getAllProducts() {
		List<ProductTable> allProducts = productTableRepository.findAllProducts();
		
		Map<String, Object> result = new HashMap<>();
		result.put("totalCount", allProducts.size());
		result.put("products", allProducts);
		
		return ResponseEntity.ok(result);
	}

	@GetMapping("/products/active")
	public ResponseEntity<Map<String, Object>> getActiveProducts() {
		List<ProductTable> activeProducts = productTableRepository.findByIsActiveTrue();
		
		Map<String, Object> result = new HashMap<>();
		result.put("totalCount", activeProducts.size());
		result.put("products", activeProducts);
		
		return ResponseEntity.ok(result);
	}
}
