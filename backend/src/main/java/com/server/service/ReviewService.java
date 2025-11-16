package com.server.service;

import com.server.dto.review.ApproveReviewRequest;
import com.server.dto.review.ReviewRequest;
import com.server.dto.review.ReviewResponse;
import com.server.model.dynamodb.ProductTable;
import com.server.model.dynamodb.ReviewTable;
import com.server.repository.ProductTableRepository;
import com.server.repository.ReviewTableRepository;
import com.server.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

	private final ReviewTableRepository reviewTableRepository;
	private final ProductTableRepository productTableRepository;

	// API cho khách hàng gửi đánh giá
	public ReviewResponse createReview(ReviewRequest request) {
		// Verify product exists
		String productPk = DynamoDBKeyUtil.productPk(request.getProductId());
		Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
		if (product.isEmpty()) {
			throw new IllegalArgumentException("Product not found with id " + request.getProductId());
		}

		// Generate review ID
		String reviewId = UUID.randomUUID().toString();
		String reviewSk = DynamoDBKeyUtil.reviewSk(reviewId);

		// Check if user already reviewed this product
		String userPk = DynamoDBKeyUtil.userReviewPk(request.getUserId());
		List<ReviewTable> userReviews = reviewTableRepository.findUserReviewsByPk(userPk);
		boolean alreadyReviewed = userReviews.stream()
			.anyMatch(r -> request.getProductId().equals(r.getProductId()));
		
		if (alreadyReviewed) {
			throw new IllegalArgumentException("User has already reviewed this product");
		}

		long now = Instant.now().toEpochMilli();
		boolean isVerifiedPurchase = StringUtils.hasText(request.getOrderId());

		// Create review with PK = PRODUCT#<product_id> (for querying by product)
		ReviewTable productReview = buildReviewItem(
			productPk, reviewSk, request, reviewId, isVerifiedPurchase, false, now, now
		);
		reviewTableRepository.save(productReview);

		// Also create review with PK = USER#<user_id> (for querying by user)
		ReviewTable userReview = buildReviewItem(
			userPk, reviewSk, request, reviewId, isVerifiedPurchase, false, now, now
		);
		reviewTableRepository.save(userReview);

		return toResponse(productReview);
	}

	// API lấy đánh giá sản phẩm theo product_id
	public List<ReviewResponse> getProductReviews(String productId, Boolean approvedOnly) {
		String productPk = DynamoDBKeyUtil.productReviewPk(productId);
		
		List<ReviewTable> reviews;
		if (approvedOnly != null && approvedOnly) {
			reviews = reviewTableRepository.findApprovedReviewsByPk(productPk);
		} else {
			reviews = reviewTableRepository.findProductReviewsByPk(productPk);
		}

		return reviews.stream()
			.map(this::toResponse)
			.collect(Collectors.toList());
	}

	// API cho Manager lấy danh sách đánh giá cần duyệt
	public List<ReviewResponse> listReviews(Boolean isApproved, String productId) {
		List<ReviewTable> reviews;

		if (StringUtils.hasText(productId)) {
			String productPk = DynamoDBKeyUtil.productReviewPk(productId);
			reviews = reviewTableRepository.findProductReviewsByPk(productPk);
		} else {
			// Get all reviews - scan all products (consider adding GSI if performance is an issue)
			// For now, we'll need to get all products and their reviews
			// This is a limitation - in production, consider using GSI or separate table
			reviews = reviewTableRepository.findAllReviews();
		}

		// Filter by isApproved if specified
		if (isApproved != null) {
			reviews = reviews.stream()
				.filter(r -> isApproved.equals(r.getIsApproved()))
				.collect(Collectors.toList());
		}

		return reviews.stream()
			.map(this::toResponse)
			.collect(Collectors.toList());
	}

	// API cho Manager duyệt đánh giá
	public ReviewResponse approveReview(String productId, String reviewId, ApproveReviewRequest request) {
		String productPk = DynamoDBKeyUtil.productReviewPk(productId);
		String reviewSk = DynamoDBKeyUtil.reviewSk(reviewId);

		ReviewTable review = reviewTableRepository.findByPkAndSk(productPk, reviewSk)
			.orElseThrow(() -> new IllegalArgumentException("Review not found with id " + reviewId + " for product " + productId));

		long now = Instant.now().toEpochMilli();

		// Update product review
		ReviewTable updatedProductReview = ReviewTable.builder()
			.pk(review.getPk())
			.sk(review.getSk())
			.itemType(review.getItemType())
			.reviewId(review.getReviewId())
			.productId(review.getProductId())
			.userId(review.getUserId())
			.orderId(review.getOrderId())
			.rating(review.getRating())
			.title(review.getTitle())
			.comment(review.getComment())
			.images(review.getImages())
			.isVerifiedPurchase(review.getIsVerifiedPurchase())
			.isApproved(request.getIsApproved())
			.helpfulCount(review.getHelpfulCount())
			.reportedCount(review.getReportedCount())
			.createdAt(review.getCreatedAt())
			.updatedAt(now)
			.build();
		reviewTableRepository.save(updatedProductReview);

		// Also update user review
		String userPk = DynamoDBKeyUtil.userReviewPk(review.getUserId());
		ReviewTable userReview = reviewTableRepository.findByPkAndSk(userPk, reviewSk)
			.orElse(null);
		if (userReview != null) {
			ReviewTable updatedUserReview = ReviewTable.builder()
				.pk(userReview.getPk())
				.sk(userReview.getSk())
				.itemType(userReview.getItemType())
				.reviewId(userReview.getReviewId())
				.productId(userReview.getProductId())
				.userId(userReview.getUserId())
				.orderId(userReview.getOrderId())
				.rating(userReview.getRating())
				.title(userReview.getTitle())
				.comment(userReview.getComment())
				.images(userReview.getImages())
				.isVerifiedPurchase(userReview.getIsVerifiedPurchase())
				.isApproved(request.getIsApproved())
				.helpfulCount(userReview.getHelpfulCount())
				.reportedCount(userReview.getReportedCount())
				.createdAt(userReview.getCreatedAt())
				.updatedAt(now)
				.build();
			reviewTableRepository.save(updatedUserReview);
		}

		return toResponse(updatedProductReview);
	}

	public ReviewResponse getReview(String productId, String reviewId) {
		String productPk = DynamoDBKeyUtil.productReviewPk(productId);
		String reviewSk = DynamoDBKeyUtil.reviewSk(reviewId);

		ReviewTable review = reviewTableRepository.findByPkAndSk(productPk, reviewSk)
			.orElseThrow(() -> new IllegalArgumentException("Review not found with id " + reviewId + " for product " + productId));
		return toResponse(review);
	}

	private ReviewTable buildReviewItem(String pk, String sk, ReviewRequest request, String reviewId,
		boolean isVerifiedPurchase, boolean isApproved, long createdAt, long updatedAt) {
		return ReviewTable.builder()
			.pk(pk)
			.sk(sk)
			.itemType("Review")
			.reviewId(reviewId)
			.productId(request.getProductId())
			.userId(request.getUserId())
			.orderId(request.getOrderId())
			.rating(request.getRating())
			.title(request.getTitle())
			.comment(request.getComment())
			.images(request.getImages())
			.isVerifiedPurchase(isVerifiedPurchase)
			.isApproved(isApproved)
			.helpfulCount(0)
			.reportedCount(0)
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private ReviewResponse toResponse(ReviewTable item) {
		return ReviewResponse.builder()
			.reviewId(item.getReviewId())
			.productId(item.getProductId())
			.userId(item.getUserId())
			.orderId(item.getOrderId())
			.rating(item.getRating())
			.title(item.getTitle())
			.comment(item.getComment())
			.images(item.getImages())
			.isVerifiedPurchase(item.getIsVerifiedPurchase())
			.isApproved(item.getIsApproved())
			.helpfulCount(item.getHelpfulCount())
			.reportedCount(item.getReportedCount())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

