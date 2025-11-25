package com.leafshop.controller;

import com.leafshop.dto.review.ApproveReviewRequest;
import com.leafshop.dto.review.ReviewResponse;
import com.leafshop.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

	private final ReviewService reviewService;

	@GetMapping
	public ResponseEntity<List<ReviewResponse>> listReviews(
		@RequestParam(required = false) Boolean isApproved,
		@RequestParam(required = false) String productId
	) {
		return ResponseEntity.ok(reviewService.listReviews(isApproved, productId));
	}

	@GetMapping("/products/{productId}/reviews/{reviewId}")
	public ResponseEntity<ReviewResponse> getReview(
		@PathVariable String productId,
		@PathVariable String reviewId
	) {
		return ResponseEntity.ok(reviewService.getReview(productId, reviewId));
	}

	@PutMapping("/products/{productId}/reviews/{reviewId}/approve")
	public ResponseEntity<ReviewResponse> approveReview(
		@PathVariable String productId,
		@PathVariable String reviewId,
		@Valid @RequestBody ApproveReviewRequest request
	) {
		return ResponseEntity.ok(reviewService.approveReview(productId, reviewId, request));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}

