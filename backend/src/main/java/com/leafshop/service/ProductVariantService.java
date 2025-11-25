package com.leafshop.service;

import com.leafshop.dto.productvariant.ProductVariantRequest;
import com.leafshop.dto.productvariant.ProductVariantResponse;
import com.leafshop.model.dynamodb.ProductTable;
import com.leafshop.repository.ProductTableRepository;
import com.leafshop.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

	private final ProductTableRepository productTableRepository;

	public ProductVariantResponse createProductVariant(String productId, ProductVariantRequest request) {
		// Verify product exists
		String productPk = DynamoDBKeyUtil.productPk(productId);
		Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
		if (product.isEmpty()) {
			throw new IllegalArgumentException("Product not found with id " + productId);
		}

		// Check if variant already exists
		String variantSk = DynamoDBKeyUtil.productVariantSk(request.getVariantId());
		Optional<ProductTable> existing = productTableRepository.findVariantByPkAndSk(productPk, variantSk);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("ProductVariant already exists with id " + request.getVariantId() + " for product " + productId);
		}

		long now = Instant.now().toEpochMilli();
		ProductTable variant = buildVariantItem(productId, request, now, now);
		productTableRepository.save(variant);
		return toResponse(productId, variant);
	}

	public ProductVariantResponse updateProductVariant(String productId, String variantId, ProductVariantRequest request) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		String variantSk = DynamoDBKeyUtil.productVariantSk(variantId);
		
		ProductTable existing = productTableRepository.findVariantByPkAndSk(productPk, variantSk)
			.orElseThrow(() -> new IllegalArgumentException("ProductVariant not found with id " + variantId + " for product " + productId));

		long now = Instant.now().toEpochMilli();
		ProductTable updated = mergeVariant(existing, request, now);
		productTableRepository.save(updated);
		return toResponse(productId, updated);
	}

	public ProductVariantResponse getProductVariant(String productId, String variantId) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		String variantSk = DynamoDBKeyUtil.productVariantSk(variantId);
		
		ProductTable variant = productTableRepository.findVariantByPkAndSk(productPk, variantSk)
			.orElseThrow(() -> new IllegalArgumentException("ProductVariant not found with id " + variantId + " for product " + productId));
		return toResponse(productId, variant);
	}

	public List<ProductVariantResponse> listProductVariants(String productId) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		
		// Verify product exists
		Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
		if (product.isEmpty()) {
			throw new IllegalArgumentException("Product not found with id " + productId);
		}

		return productTableRepository.findVariantsByPk(productPk)
			.stream()
			.map(variant -> toResponse(productId, variant))
			.collect(Collectors.toList());
	}

	public void deleteProductVariant(String productId, String variantId) {
		String productPk = DynamoDBKeyUtil.productPk(productId);
		String variantSk = DynamoDBKeyUtil.productVariantSk(variantId);
		
		ProductTable variant = productTableRepository.findVariantByPkAndSk(productPk, variantSk)
			.orElseThrow(() -> new IllegalArgumentException("ProductVariant not found with id " + variantId + " for product " + productId));
		productTableRepository.deleteByPkAndSk(variant.getPk(), variant.getSk());
	}

	private ProductTable buildVariantItem(String productId, ProductVariantRequest request, long createdAt, long updatedAt) {
		return ProductTable.builder()
			.pk(DynamoDBKeyUtil.productPk(productId))
			.sk(DynamoDBKeyUtil.productVariantSk(request.getVariantId()))
			.itemType("Variant")
			.variantAttributes(request.getVariantAttributes())
			.variantPrice(request.getVariantPrice())
			.sku(request.getSku())
			.barcode(request.getBarcode())
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private ProductTable mergeVariant(ProductTable existing, ProductVariantRequest request, long updatedAt) {
		return ProductTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.variantAttributes(request.getVariantAttributes() != null ? request.getVariantAttributes() : existing.getVariantAttributes())
			.variantPrice(request.getVariantPrice() != null ? request.getVariantPrice() : existing.getVariantPrice())
			.sku(StringUtils.hasText(request.getSku()) ? request.getSku() : existing.getSku())
			.barcode(StringUtils.hasText(request.getBarcode()) ? request.getBarcode() : existing.getBarcode())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private ProductVariantResponse toResponse(String productId, ProductTable item) {
		// Extract variantId from SK (VARIANT#<variant_id>)
		String variantId = item.getSk() != null && item.getSk().startsWith("VARIANT#")
			? item.getSk().substring(8)
			: null;

		return ProductVariantResponse.builder()
			.productId(productId)
			.variantId(variantId)
			.variantAttributes(item.getVariantAttributes())
			.variantPrice(item.getVariantPrice())
			.sku(item.getSku())
			.barcode(item.getBarcode())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

