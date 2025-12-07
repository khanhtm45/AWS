package com.leafshop.dto.chatbot;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSuggestionRequest {
	private String query; // Text query để tìm sản phẩm
	private Integer limit; // Số lượng sản phẩm gợi ý (default: 5)
}
