package com.leafshop.service;

import com.leafshop.dto.customer.CustomerProductResponse;
import com.leafshop.dto.customer.PaginatedResponse;
import com.leafshop.dto.productmedia.ProductMediaResponse;
import com.leafshop.dto.productvariant.ProductVariantResponse;
import com.leafshop.model.dynamodb.ProductTable;
import com.leafshop.repository.ProductTableRepository;
import com.leafshop.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CustomerProductService {

	private final ProductTableRepository productTableRepository;

	public PaginatedResponse<CustomerProductResponse> searchProducts(
		String keyword,
		String categoryId,
		String typeId,
		Double minPrice,
		Double maxPrice,
		String size,
		String color,
		String sortBy, // newest, price_asc, price_desc, best_selling
		int page,
		int pageSize
	) {
		// Lấy tất cả products active
		Stream<ProductTable> products = productTableRepository.findByIsActiveTrue().stream();

		// Filter theo keyword (tìm trong name, description, tags)
		if (StringUtils.hasText(keyword)) {
			String lowerKeyword = keyword.toLowerCase();
			products = products.filter(p -> 
				(p.getName() != null && p.getName().toLowerCase().contains(lowerKeyword)) ||
				(p.getDescription() != null && p.getDescription().toLowerCase().contains(lowerKeyword)) ||
				(p.getTags() != null && p.getTags().stream().anyMatch(tag -> tag.toLowerCase().contains(lowerKeyword)))
			);
		}

		// Filter theo categoryId
		if (StringUtils.hasText(categoryId)) {
			products = products.filter(p -> categoryId.equals(p.getCategoryId()));
		}

		// Filter theo typeId
		if (StringUtils.hasText(typeId)) {
			products = products.filter(p -> typeId.equals(p.getTypeId()));
		}

		// Filter theo giá
		if (minPrice != null) {
			products = products.filter(p -> p.getPrice() != null && p.getPrice() >= minPrice);
		}
		if (maxPrice != null) {
			products = products.filter(p -> p.getPrice() != null && p.getPrice() <= maxPrice);
		}

		// Filter theo size và color (cần check trong variants)
		if (StringUtils.hasText(size) || StringUtils.hasText(color)) {
			products = products.filter(p -> {
				String pk = p.getPk();
				List<ProductTable> variants = productTableRepository.findVariantsByPk(pk);
				if (variants.isEmpty()) {
					return false; // Nếu không có variant thì không match
				}
				return variants.stream().anyMatch(v -> {
					boolean sizeMatch = !StringUtils.hasText(size) || 
						(StringUtils.hasText(v.getSize()) && size.equalsIgnoreCase(v.getSize()));
					boolean colorMatch = !StringUtils.hasText(color) || 
						(StringUtils.hasText(v.getColor()) && color.equalsIgnoreCase(v.getColor()));
					return sizeMatch && colorMatch;
				});
			});
		}

		// Sort
		List<ProductTable> productList = products.collect(Collectors.toList());
		if (StringUtils.hasText(sortBy)) {
			switch (sortBy.toLowerCase()) {
				case "newest":
					// Sort theo updatedAt (thời gian cập nhật gần nhất) - sản phẩm mới cập nhật sẽ hiển thị trước
					productList.sort(Comparator.comparing(ProductTable::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
					break;
				case "oldest":
					// Sort theo createdAt (sản phẩm cũ nhất trước)
					productList.sort(Comparator.comparing(ProductTable::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
					break;
				case "price_asc":
					// Sort theo giá tăng dần (rẻ nhất trước)
					productList.sort(Comparator.comparing(ProductTable::getPrice, Comparator.nullsLast(Comparator.naturalOrder())));
					break;
				case "price_desc":
					// Sort theo giá giảm dần (đắt nhất trước)
					productList.sort(Comparator.comparing(ProductTable::getPrice, Comparator.nullsLast(Comparator.reverseOrder())));
					break;
				case "best_selling":
					// Cần thêm field soldCount hoặc query từ OrderTable để tính số lượng bán :))))
					// Tạm thời sort theo createdAt (sản phẩm mới tạo trước)
					productList.sort(Comparator.comparing(ProductTable::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
					break;
				default:
					// Default sort by newest (theo updatedAt)
					productList.sort(Comparator.comparing(ProductTable::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
			}
		} else {
			// Default sort by newest (theo updatedAt)
			productList.sort(Comparator.comparing(ProductTable::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
		}

		// Pagination
		int totalElements = productList.size();
		int totalPages = (int) Math.ceil((double) totalElements / pageSize);
		int fromIndex = page * pageSize;

		List<CustomerProductResponse> content = productList.stream()
			.skip(fromIndex)
			.limit(pageSize)
			.map(this::toCustomerResponse)
			.collect(Collectors.toList());

		return PaginatedResponse.<CustomerProductResponse>builder()
			.content(content)
			.page(page)
			.size(pageSize)
			.totalElements(totalElements)
			.totalPages(totalPages)
			.hasNext(page < totalPages - 1)
			.hasPrevious(page > 0)
			.build();
	}

	public CustomerProductResponse getProductDetail(String productId) {
		String pk = DynamoDBKeyUtil.productPk(productId);
		ProductTable product = productTableRepository.findProductByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Product not found with id " + productId));

		if (!Boolean.TRUE.equals(product.getIsActive())) {
			throw new IllegalArgumentException("Product is not active");
		}

		return toCustomerResponseWithDetails(product);
	}

	public List<CustomerProductResponse> getRelatedProducts(String productId, int limit) {
		String pk = DynamoDBKeyUtil.productPk(productId);
		ProductTable product = productTableRepository.findProductByPk(pk)
			.orElseThrow(() -> new IllegalArgumentException("Product not found with id " + productId));

		// Lấy sản phẩm cùng category và type, loại trừ sản phẩm hiện tại
		return productTableRepository.findByIsActiveTrue().stream()
			.filter(p -> !p.getPk().equals(pk)) // Loại trừ sản phẩm hiện tại
			.filter(p -> {
				// Cùng category hoặc cùng type
				boolean sameCategory = StringUtils.hasText(product.getCategoryId()) && 
					product.getCategoryId().equals(p.getCategoryId());
				boolean sameType = StringUtils.hasText(product.getTypeId()) && 
					product.getTypeId().equals(p.getTypeId());
				return sameCategory || sameType;
			})
			.sorted(Comparator.comparing(ProductTable::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
			.limit(limit)
			.map(this::toCustomerResponse)
			.collect(Collectors.toList());
	}

	private CustomerProductResponse toCustomerResponse(ProductTable item) {
		String productId = extractProductId(item.getPk());
		String pk = item.getPk();

		// Lấy variants và media
		List<ProductTable> variants = productTableRepository.findVariantsByPk(pk);
		List<ProductTable> media = productTableRepository.findMediaByPk(pk);

		return CustomerProductResponse.builder()
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
			.variants(variants.stream().map(v -> toVariantResponse(productId, v)).collect(Collectors.toList()))
			.media(media.stream().map(m -> toMediaResponse(productId, m)).collect(Collectors.toList()))
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}

	private CustomerProductResponse toCustomerResponseWithDetails(ProductTable item) {
		return toCustomerResponse(item);
	}

	private ProductVariantResponse toVariantResponse(String productId, ProductTable item) {
		String variantId = item.getSk() != null && item.getSk().startsWith("VARIANT#")
			? item.getSk().substring(8)
			: null;

		return ProductVariantResponse.builder()
			.productId(productId)
			.variantId(variantId)
			.color(item.getColor())
			.size(item.getSize())
			.variantPrice(item.getVariantPrice())
			.sku(item.getSku())
			.barcode(item.getBarcode())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}

	private ProductMediaResponse toMediaResponse(String productId, ProductTable item) {
		String mediaId = item.getSk() != null && item.getSk().startsWith("MEDIA#")
			? item.getSk().substring(6)
			: null;

		return ProductMediaResponse.builder()
			.productId(productId)
			.mediaId(mediaId)
			.mediaUrl(item.getMediaUrl())
			.s3Key(item.getS3Key())
			.mediaType(item.getMediaType())
			.mediaOrder(item.getMediaOrder())
			.isPrimary(item.getIsPrimary())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}

	private String extractProductId(String pk) {
		return pk != null && pk.startsWith("PRODUCT#")
			? pk.substring(8)
			: null;
	}
}

