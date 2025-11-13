package com.server.service;

import com.server.dto.category.CategoryRequest;
import com.server.dto.category.CategoryResponse;
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
public class CategoryService {

	private final ProductTableRepository productTableRepository;

	public CategoryResponse createCategory(CategoryRequest request) {
		String pk = DynamoDBKeyUtil.categoryPk(request.getCategoryId());
		Optional<ProductTable> existing = productTableRepository.findCategoryByPk(pk);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("Category already exists with id " + request.getCategoryId());
		}

		long now = Instant.now().toEpochMilli();
		ProductTable category = buildCategoryItem(request, now, now);
		productTableRepository.save(category);
		return toResponse(category);
	}

	public CategoryResponse updateCategory(String categoryId, CategoryRequest request) {
		String pk = DynamoDBKeyUtil.categoryPk(categoryId);
		ProductTable existing = productTableRepository.findCategoryByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Category not found with id " + categoryId));

		long now = Instant.now().toEpochMilli();
		ProductTable updated = mergeCategory(existing, request, now);
		productTableRepository.save(updated);
		return toResponse(updated);
	}

	public CategoryResponse getCategory(String categoryId) {
		String pk = DynamoDBKeyUtil.categoryPk(categoryId);
		ProductTable category = productTableRepository.findCategoryByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Category not found with id " + categoryId));
		return toResponse(category);
	}

	public List<CategoryResponse> listCategories(String parentCategoryId, Boolean isActive) {
		return productTableRepository.findAllCategories()
			.stream()
			.filter(item -> filterByParent(item, parentCategoryId))
			.filter(item -> filterByActive(item, isActive))
			.map(this::toResponse)
			.collect(Collectors.toList());
	}

	public void deleteCategory(String categoryId) {
		String pk = DynamoDBKeyUtil.categoryPk(categoryId);
		ProductTable category = productTableRepository.findCategoryByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Category not found with id " + categoryId));
		productTableRepository.deleteByPkAndSk(category.getPk(), category.getSk());
	}

	private ProductTable buildCategoryItem(CategoryRequest request, long createdAt, long updatedAt) {
		return ProductTable.builder()
			.pk(DynamoDBKeyUtil.categoryPk(request.getCategoryId()))
			.sk(DynamoDBKeyUtil.categoryMetaSk())
			.itemType("Category")
			.categoryId(request.getCategoryId())
			.categoryName(request.getCategoryName())
			.parentCategoryId(request.getParentCategoryId())
			.categoryLevel(request.getCategoryLevel())
			.categoryImage(request.getCategoryImage())
			.isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private ProductTable mergeCategory(ProductTable existing, CategoryRequest request, long updatedAt) {
		return ProductTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.categoryId(existing.getCategoryId())
			.categoryName(StringUtils.hasText(request.getCategoryName()) ? request.getCategoryName() : existing.getCategoryName())
			.parentCategoryId(request.getParentCategoryId() != null ? request.getParentCategoryId() : existing.getParentCategoryId())
			.categoryLevel(request.getCategoryLevel() != null ? request.getCategoryLevel() : existing.getCategoryLevel())
			.categoryImage(request.getCategoryImage() != null ? request.getCategoryImage() : existing.getCategoryImage())
			.isActive(request.getIsActive() != null ? request.getIsActive() : existing.getIsActive())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private boolean filterByParent(ProductTable item, String parentCategoryId) {
		if (!StringUtils.hasText(parentCategoryId)) {
			return true;
		}
		return parentCategoryId.equals(item.getParentCategoryId());
	}

	private boolean filterByActive(ProductTable item, Boolean isActive) {
		if (isActive == null) {
			return true;
		}
		return Boolean.TRUE.equals(isActive) == Boolean.TRUE.equals(item.getIsActive());
	}

	private CategoryResponse toResponse(ProductTable item) {
		return CategoryResponse.builder()
			.categoryId(item.getCategoryId())
			.categoryName(item.getCategoryName())
			.parentCategoryId(item.getParentCategoryId())
			.categoryLevel(item.getCategoryLevel())
			.categoryImage(item.getCategoryImage())
			.isActive(item.getIsActive())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}


