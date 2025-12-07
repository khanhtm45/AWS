package com.leafshop.service;

import com.leafshop.dto.chatbot.ProductSuggestionResponse;
import com.leafshop.model.dynamodb.ProductTable;
import com.leafshop.repository.ProductTableRepository;
import com.leafshop.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

	private final ProductTableRepository productTableRepository;

	/**
	 * Gợi ý sản phẩm dựa trên text query
	 * - Tìm kiếm trong name, description, tags của sản phẩm
	 * - Hỗ trợ tìm theo phong cách: trẻ trung, thanh lịch, thể thao, v.v.
	 * - Trả về danh sách sản phẩm phù hợp nhất
	 */
	public List<ProductSuggestionResponse> suggestProducts(String query, Integer limit) {
		if (!StringUtils.hasText(query)) {
			return Collections.emptyList();
		}

		// Default limit
		if (limit == null || limit <= 0) {
			limit = 5;
		}

		// Normalize query
		String normalizedQuery = query.toLowerCase().trim();
		String[] keywords = normalizedQuery.split("\\s+");

		// Expand query với style keywords
		List<String> expandedKeywords = expandQueryWithStyleKeywords(normalizedQuery, keywords);

		// Lấy tất cả products (không filter isActive để debug)
		List<ProductTable> allProducts = productTableRepository.findAllProducts();

		// Score-based matching
		List<ScoredProduct> scoredProducts = allProducts.stream()
			.map(product -> new ScoredProduct(product, calculateRelevanceScore(product, normalizedQuery, keywords, expandedKeywords)))
			.filter(sp -> sp.score > 0) // Chỉ lấy products có score > 0
			.sorted(Comparator.comparingInt(ScoredProduct::getScore).reversed())
			.limit(limit)
			.collect(Collectors.toList());

		// Convert to response
		return scoredProducts.stream()
			.map(sp -> buildProductSuggestion(sp.product))
			.collect(Collectors.toList());
	}

	/**
	 * Mở rộng query với style keywords
	 * Ví dụ: "trẻ trung" → thêm ["tươi mới", "youth", "fresh"]
	 */
	private List<String> expandQueryWithStyleKeywords(String query, String[] keywords) {
		List<String> expanded = new ArrayList<>(Arrays.asList(keywords));
		
		// Map style keywords - Mỗi style có identity riêng biệt
		Map<String, List<String>> styleKeywords = new HashMap<>();
		
		// Phong cách trẻ trung - tươi mới, năng động nhẹ nhàng
		styleKeywords.put("trẻ trung", Arrays.asList("tươi mới", "fresh", "youth", "youthful", "vibrant", "energetic"));
		
		// Phong cách cá tính - độc đáo, nổi bật, khác biệt
		styleKeywords.put("cá tính", Arrays.asList("độc đáo", "nổi bật", "unique", "bold", "edgy", "standout", "individual"));
		
		// Phong cách thanh lịch - sang trọng, lịch sự
		styleKeywords.put("thanh lịch", Arrays.asList("sang trọng", "lịch sự", "elegant", "sophisticated", "classy", "refined", "graceful"));
		
		// Phong cách thể thao - năng động mạnh mẽ, liên quan exercise
		styleKeywords.put("thể thao", Arrays.asList("sporty", "athletic", "active", "gym", "fitness", "training", "workout", "performance"));
		
		// Phong cách công sở - chuyên nghiệp, formal
		styleKeywords.put("công sở", Arrays.asList("formal", "office", "business", "professional", "workwear", "corporate"));
		
		// Phong cách dạo phố - thoải mái, casual hàng ngày
		styleKeywords.put("dạo phố", Arrays.asList("casual", "street", "everyday", "comfortable", "relaxed", "laid-back"));
		
		// Phong cách minimalist - đơn giản, tối giản
		styleKeywords.put("minimalist", Arrays.asList("đơn giản", "tối giản", "basic", "simple", "clean", "minimal", "essential"));
		
		// Phong cách vintage - cổ điển, retro
		styleKeywords.put("vintage", Arrays.asList("retro", "cổ điển", "classic", "old-school", "timeless"));
		
		// Phong cách streetwear - đường phố, hip-hop
		styleKeywords.put("streetwear", Arrays.asList("street", "urban", "hip-hop", "oversized", "baggy", "loose-fit"));
		
		// Phong cách preppy - học đường, varsity
		styleKeywords.put("preppy", Arrays.asList("học đường", "college", "varsity", "ivy", "neat", "polished"));
		
		// Check và mở rộng
		for (Map.Entry<String, List<String>> entry : styleKeywords.entrySet()) {
			if (query.contains(entry.getKey())) {
				expanded.addAll(entry.getValue());
			}
		}
		
		return expanded;
	}

	/**
	 * Tính điểm relevance của sản phẩm với query
	 * - Exact match trong name: +100
	 * - Partial match trong name: +50
	 * - Match trong description: +30
	 * - Match trong tags: +20
	 * - Bonus cho mỗi keyword match: +10
	 * - Style match bonus: +15
	 */
	private int calculateRelevanceScore(ProductTable product, String query, String[] keywords, List<String> expandedKeywords) {
		int score = 0;

		String name = product.getName() != null ? product.getName().toLowerCase() : "";
		String description = product.getDescription() != null ? product.getDescription().toLowerCase() : "";
		List<String> tags = product.getTags() != null ? 
			product.getTags().stream().map(String::toLowerCase).collect(Collectors.toList()) : 
			Collections.emptyList();

		// Exact match trong name
		if (name.equals(query)) {
			score += 100;
		}

		// Partial match trong name
		if (name.contains(query)) {
			score += 50;
		}

		// Check từng keyword gốc
		for (String keyword : keywords) {
			if (keyword.length() < 2) continue; // Bỏ qua keyword quá ngắn

			// Name contains keyword
			if (name.contains(keyword)) {
				score += 10;
			}

			// Description contains keyword
			if (description.contains(keyword)) {
				score += 5;
			}

			// Tags contain keyword
			for (String tag : tags) {
				if (tag.contains(keyword)) {
					score += 8;
				}
			}
		}

		// Check expanded keywords (style matching)
		for (String expKeyword : expandedKeywords) {
			if (expKeyword.length() < 2) continue;

			// Name contains expanded keyword
			if (name.contains(expKeyword)) {
				score += 15;
			}

			// Description contains expanded keyword
			if (description.contains(expKeyword)) {
				score += 10;
			}

			// Tags contain expanded keyword
			for (String tag : tags) {
				if (tag.contains(expKeyword)) {
					score += 12;
				}
			}
		}

		// Bonus cho products có description dài (thông tin chi tiết hơn)
		if (description.length() > 50) {
			score += 2;
		}

		return score;
	}

	/**
	 * Build ProductSuggestionResponse từ ProductTable
	 */
	private ProductSuggestionResponse buildProductSuggestion(ProductTable product) {
		String productId = extractProductId(product.getPk());

		// Lấy variants để collect colors và sizes
		List<ProductTable> variants = productTableRepository.findVariantsByPk(product.getPk());
		
		Set<String> allColors = new HashSet<>();
		Set<String> allSizes = new HashSet<>();

		for (ProductTable variant : variants) {
			if (variant.getColors() != null) {
				allColors.addAll(variant.getColors());
			}
			if (StringUtils.hasText(variant.getSize())) {
				allSizes.add(variant.getSize());
			}
		}

		// Lấy primary image
		List<ProductTable> mediaList = productTableRepository.findMediaByPk(product.getPk());
		String primaryImageUrl = mediaList.stream()
			.filter(m -> Boolean.TRUE.equals(m.getIsPrimary()))
			.map(ProductTable::getMediaUrl)
			.findFirst()
			.orElse(mediaList.isEmpty() ? null : mediaList.get(0).getMediaUrl());

		return ProductSuggestionResponse.builder()
			.productId(productId)
			.name(product.getName())
			.description(product.getDescription())
			.price(product.getPrice())
			.categoryId(product.getCategoryId())
			.typeId(product.getTypeId())
			.colors(new ArrayList<>(allColors))
			.sizes(new ArrayList<>(allSizes))
			.primaryImageUrl(primaryImageUrl)
			.isPreorder(product.getIsPreorder())
			.preorderDays(product.getPreorderDays())
			.build();
	}

	/**
	 * Helper class để lưu product với score
	 */
	private static class ScoredProduct {
		ProductTable product;
		int score;

		ScoredProduct(ProductTable product, int score) {
			this.product = product;
			this.score = score;
		}

		public int getScore() {
			return score;
		}
	}

	/**
	 * Extract productId từ PK
	 */
	private String extractProductId(String pk) {
		return pk != null && pk.startsWith("PRODUCT#")
			? pk.substring(8)
			: null;
	}
}
