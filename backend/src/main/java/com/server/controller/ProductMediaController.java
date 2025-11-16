package com.server.controller;

import com.server.dto.productmedia.ProductMediaRequest;
import com.server.dto.productmedia.ProductMediaResponse;
import com.server.service.ProductMediaService;
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
@RequestMapping("/api/products/{productId}/media")
@Validated
@RequiredArgsConstructor
public class ProductMediaController {

	private final ProductMediaService productMediaService;

	@PostMapping
	public ResponseEntity<ProductMediaResponse> createProductMedia(
		@PathVariable String productId,
		@Valid @RequestBody ProductMediaRequest request
	) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productMediaService.createProductMedia(productId, request));
	}

	@PutMapping("/{mediaId}")
	public ResponseEntity<ProductMediaResponse> updateProductMedia(
		@PathVariable String productId,
		@PathVariable String mediaId,
		@Valid @RequestBody ProductMediaRequest request
	) {
		return ResponseEntity.ok(productMediaService.updateProductMedia(productId, mediaId, request));
	}

	@GetMapping("/{mediaId}")
	public ResponseEntity<ProductMediaResponse> getProductMedia(
		@PathVariable String productId,
		@PathVariable String mediaId
	) {
		return ResponseEntity.ok(productMediaService.getProductMedia(productId, mediaId));
	}

	@GetMapping
	public ResponseEntity<List<ProductMediaResponse>> listProductMedia(@PathVariable String productId) {
		return ResponseEntity.ok(productMediaService.listProductMedia(productId));
	}

	@DeleteMapping("/{mediaId}")
	public ResponseEntity<Void> deleteProductMedia(
		@PathVariable String productId,
		@PathVariable String mediaId
	) {
		productMediaService.deleteProductMedia(productId, mediaId);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}

