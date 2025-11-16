package com.server.service;

import com.server.dto.productmedia.ProductMediaRequest;
import com.server.dto.productmedia.ProductMediaResponse;
import com.server.model.dynamodb.ProductTable;
import com.server.repository.ProductTableRepository;
import com.server.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductMediaService {

	private final ProductTableRepository productTableRepository;

	public ProductMediaResponse createProductMedia(String productId, ProductMediaRequest request) {
		// Verify product exists
		String productPk = DynamoDBKeyUtil.productPk(productId);
		Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
		if (product.isEmpty()) {
			throw new IllegalArgumentException("Product not found with id " + productId);
		}

		// Check if media already exists
		String mediaSk = DynamoDBKeyUtil.productMediaSk(request.getMediaId());
		Optional<ProductTable> existing = productTableRepository.findMediaByPkAndSk(productPk, mediaSk);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("ProductMedia already exists with id " + request.getMediaId() + " for product " + productId);
		}

		long now = Instant.now().toEpochMilli();
		ProductTable media = buildMediaItem(productId, request, now, now);
		productTableRepository.save(media);
		return toResponse(productId, media);
	}

	public ProductMediaResponse updateProductMedia(String productId, String mediaId, ProductMediaRequest request) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		String mediaSk = DynamoDBKeyUtil.productMediaSk(mediaId);
		
		ProductTable existing = productTableRepository.findMediaByPkAndSk(productPk, mediaSk)
			.orElseThrow(() -> new IllegalArgumentException("ProductMedia not found with id " + mediaId + " for product " + productId));

		long now = Instant.now().toEpochMilli();
		ProductTable updated = mergeMedia(existing, request, now);
		productTableRepository.save(updated);
		return toResponse(productId, updated);
	}

	public ProductMediaResponse getProductMedia(String productId, String mediaId) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		String mediaSk = DynamoDBKeyUtil.productMediaSk(mediaId);
		
		ProductTable media = productTableRepository.findMediaByPkAndSk(productPk, mediaSk)
			.orElseThrow(() -> new IllegalArgumentException("ProductMedia not found with id " + mediaId + " for product " + productId));
		return toResponse(productId, media);
	}

	public List<ProductMediaResponse> listProductMedia(String productId) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		
		// Verify product exists
		Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
		if (product.isEmpty()) {
			throw new IllegalArgumentException("Product not found with id " + productId);
		}

		return productTableRepository.findMediaByPk(productPk)
			.stream()
			.map(media -> toResponse(productId, media))
			.collect(Collectors.toList());
	}

	public void deleteProductMedia(String productId, String mediaId) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		String mediaSk = DynamoDBKeyUtil.productMediaSk(mediaId);
		
		ProductTable media = productTableRepository.findMediaByPkAndSk(productPk, mediaSk)
			.orElseThrow(() -> new IllegalArgumentException("ProductMedia not found with id " + mediaId + " for product " + productId));
		productTableRepository.deleteByPkAndSk(media.getPk(), media.getSk());
	}

	private ProductTable buildMediaItem(String productId, ProductMediaRequest request, long createdAt, long updatedAt) {
		return ProductTable.builder()
			.pk(DynamoDBKeyUtil.productPk(productId))
			.sk(DynamoDBKeyUtil.productMediaSk(request.getMediaId()))
			.itemType("Media")
			.mediaUrl(request.getMediaUrl())
			.mediaType(request.getMediaType())
			.mediaOrder(request.getMediaOrder())
			.isPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : Boolean.FALSE)
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private ProductTable mergeMedia(ProductTable existing, ProductMediaRequest request, long updatedAt) {
		return ProductTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.mediaUrl(StringUtils.hasText(request.getMediaUrl()) ? request.getMediaUrl() : existing.getMediaUrl())
			.mediaType(StringUtils.hasText(request.getMediaType()) ? request.getMediaType() : existing.getMediaType())
			.mediaOrder(request.getMediaOrder() != null ? request.getMediaOrder() : existing.getMediaOrder())
			.isPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : existing.getIsPrimary())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private ProductMediaResponse toResponse(String productId, ProductTable item) {
		// Extract mediaId from SK (MEDIA#<media_id>)
		String mediaId = item.getSk() != null && item.getSk().startsWith("MEDIA#")
			? item.getSk().substring(6)
			: null;

		return ProductMediaResponse.builder()
			.productId(productId)
			.mediaId(mediaId)
			.mediaUrl(item.getMediaUrl())
			.mediaType(item.getMediaType())
			.mediaOrder(item.getMediaOrder())
			.isPrimary(item.getIsPrimary())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

