package com.server.service;

import com.server.dto.producttype.ProductTypeRequest;
import com.server.dto.producttype.ProductTypeResponse;
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
public class ProductTypeService {

	private final ProductTableRepository productTableRepository;

	public ProductTypeResponse createProductType(ProductTypeRequest request) {
		String pk = DynamoDBKeyUtil.typePk(request.getTypeId());
		Optional<ProductTable> existing = productTableRepository.findTypeByPk(pk);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("ProductType already exists with id " + request.getTypeId());
		}

		long now = Instant.now().toEpochMilli();
		ProductTable productType = buildProductTypeItem(request, now, now);
		productTableRepository.save(productType);
		return toResponse(productType);
	}

	public ProductTypeResponse updateProductType(String typeId, ProductTypeRequest request) {
		String pk = DynamoDBKeyUtil.typePk(typeId);
		ProductTable existing = productTableRepository.findTypeByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("ProductType not found with id " + typeId));

		long now = Instant.now().toEpochMilli();
		ProductTable updated = mergeProductType(existing, request, now);
		productTableRepository.save(updated);
		return toResponse(updated);
	}

	public ProductTypeResponse getProductType(String typeId) {
		String pk = DynamoDBKeyUtil.typePk(typeId);
		ProductTable productType = productTableRepository.findTypeByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("ProductType not found with id " + typeId));
		return toResponse(productType);
	}

	public List<ProductTypeResponse> listProductTypes() {
		return productTableRepository.findAllTypes()
			.stream()
			.map(this::toResponse)
			.collect(Collectors.toList());
	}

	public void deleteProductType(String typeId) {
		String pk = DynamoDBKeyUtil.typePk(typeId);
		ProductTable productType = productTableRepository.findTypeByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("ProductType not found with id " + typeId));
		productTableRepository.deleteByPkAndSk(productType.getPk(), productType.getSk());
	}

	private ProductTable buildProductTypeItem(ProductTypeRequest request, long createdAt, long updatedAt) {
		return ProductTable.builder()
			.pk(DynamoDBKeyUtil.typePk(request.getTypeId()))
			.sk(DynamoDBKeyUtil.typeMetaSk())
			.itemType("Type")
			.typeId(request.getTypeId())
			.typeName(request.getTypeName())
			.typeDescription(request.getTypeDescription())
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private ProductTable mergeProductType(ProductTable existing, ProductTypeRequest request, long updatedAt) {
		return ProductTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.typeId(existing.getTypeId())
			.typeName(StringUtils.hasText(request.getTypeName()) ? request.getTypeName() : existing.getTypeName())
			.typeDescription(StringUtils.hasText(request.getTypeDescription()) ? request.getTypeDescription() : existing.getTypeDescription())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private ProductTypeResponse toResponse(ProductTable item) {
		return ProductTypeResponse.builder()
			.typeId(item.getTypeId())
			.typeName(item.getTypeName())
			.typeDescription(item.getTypeDescription())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

