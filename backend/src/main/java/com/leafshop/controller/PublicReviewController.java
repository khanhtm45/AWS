package com.leafshop.controller;

import com.leafshop.dto.review.ReviewRequest;
import com.leafshop.dto.review.ReviewResponse;
import com.leafshop.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/reviews")
@Validated
@RequiredArgsConstructor
public class PublicReviewController {

	private final ReviewService reviewService;

	@PostMapping
	public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(request));
	}

	@GetMapping("/products/{productId}")
	public ResponseEntity<List<ReviewResponse>> getProductReviews(
		@PathVariable String productId,
		@RequestParam(required = false, defaultValue = "true") Boolean approvedOnly
	) {
		return ResponseEntity.ok(reviewService.getProductReviews(productId, approvedOnly));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}


