package com.server.service;

import com.server.dto.product.ProductRequest;
import com.server.dto.product.ProductResponse;
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
public class ProductService {

	private final ProductTableRepository productTableRepository;

	public ProductResponse createProduct(ProductRequest request) {
		String pk = DynamoDBKeyUtil.productPk(request.getProductId());
		Optional<ProductTable> existing = productTableRepository.findProductByPk(pk);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("Product already exists with id " + request.getProductId());
		}

		long now = Instant.now().toEpochMilli();
		ProductTable product = buildProductItem(request, now, now);
		productTableRepository.save(product);
		return toResponse(product);
	}

	public ProductResponse updateProduct(String productId, ProductRequest request) {
		String pk = DynamoDBKeyUtil.productPk(productId);
		ProductTable existing = productTableRepository.findProductByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Product not found with id " + productId));

		long now = Instant.now().toEpochMilli();
		ProductTable updated = mergeProduct(existing, request, now);
		productTableRepository.save(updated);
		return toResponse(updated);
	}

	public ProductResponse getProduct(String productId) {
		String pk = DynamoDBKeyUtil.productPk(productId);
		ProductTable product = productTableRepository.findProductByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Product not found with id " + productId));
		return toResponse(product);
	}

	public List<ProductResponse> listProducts(String categoryId, String typeId, Boolean isActive) {
		return productTableRepository.findAllProducts()
			.stream()
			.filter(item -> filterByCategory(item, categoryId))
			.filter(item -> filterByType(item, typeId))
			.filter(item -> filterByActive(item, isActive))
			.map(this::toResponse)
			.collect(Collectors.toList());
	}

	public void deleteProduct(String productId) {
		String pk = DynamoDBKeyUtil.productPk(productId);
		ProductTable product = productTableRepository.findProductByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Product not found with id " + productId));
		productTableRepository.deleteByPkAndSk(product.getPk(), product.getSk());
	}

	private ProductTable buildProductItem(ProductRequest request, long createdAt, long updatedAt) {
		return ProductTable.builder()
			.pk(DynamoDBKeyUtil.productPk(request.getProductId()))
			.sk(DynamoDBKeyUtil.productMetaSk())
			.itemType("Product")
			.name(request.getName())
			.description(request.getDescription())
			.price(request.getPrice())
			.categoryId(request.getCategoryId())
			.typeId(request.getTypeId())
			.isPreorder(request.getIsPreorder() != null ? request.getIsPreorder() : Boolean.FALSE)
			.preorderDays(request.getPreorderDays())
			.isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
			.tags(request.getTags())
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private ProductTable mergeProduct(ProductTable existing, ProductRequest request, long updatedAt) {
		return ProductTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.name(StringUtils.hasText(request.getName()) ? request.getName() : existing.getName())
			.description(StringUtils.hasText(request.getDescription()) ? request.getDescription() : existing.getDescription())
			.price(request.getPrice() != null ? request.getPrice() : existing.getPrice())
			.categoryId(StringUtils.hasText(request.getCategoryId()) ? request.getCategoryId() : existing.getCategoryId())
			.typeId(StringUtils.hasText(request.getTypeId()) ? request.getTypeId() : existing.getTypeId())
			.isPreorder(request.getIsPreorder() != null ? request.getIsPreorder() : existing.getIsPreorder())
			.preorderDays(request.getPreorderDays() != null ? request.getPreorderDays() : existing.getPreorderDays())
			.isActive(request.getIsActive() != null ? request.getIsActive() : existing.getIsActive())
			.tags(request.getTags() != null ? request.getTags() : existing.getTags())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private boolean filterByCategory(ProductTable item, String categoryId) {
		if (!StringUtils.hasText(categoryId)) {
			return true;
		}
		return categoryId.equals(item.getCategoryId());
	}

	private boolean filterByType(ProductTable item, String typeId) {
		if (!StringUtils.hasText(typeId)) {
			return true;
		}
		return typeId.equals(item.getTypeId());
	}

	private boolean filterByActive(ProductTable item, Boolean isActive) {
		if (isActive == null) {
			return true;
		}
		return Boolean.TRUE.equals(isActive) == Boolean.TRUE.equals(item.getIsActive());
	}

	private ProductResponse toResponse(ProductTable item) {
		// Extract productId from PK (PRODUCT#<product_id>)
		String productId = item.getPk() != null && item.getPk().startsWith("PRODUCT#")
			? item.getPk().substring(8)
			: null;

		return ProductResponse.builder()
			.productId(productId)
			.name(item.getName())
			.description(item.getDescription())
			.price(item.getPrice())
			.categoryId(item.getCategoryId())
			.typeId(item.getTypeId())
			.isPreorder(item.getIsPreorder())
			.preorderDays(item.getPreorderDays())
			.isActive(item.getIsActive())
			.tags(item.getTags())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

