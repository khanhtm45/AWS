package com.leafshop.dto.review;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ReviewResponse {
	String reviewId;
	String productId;
	String userId;
	String orderId;
	Integer rating;
	String title;
	String comment;
	List<String> images;
	Boolean isVerifiedPurchase;
	Boolean isApproved;
	Integer helpfulCount;
	Integer reportedCount;
	Long createdAt;
	Long updatedAt;
}

