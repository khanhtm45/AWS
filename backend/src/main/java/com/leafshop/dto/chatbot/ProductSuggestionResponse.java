package com.leafshop.dto.chatbot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSuggestionResponse {
	private String productId;
	private String name;
	private String description;
	private Double price;
	private String categoryId;
	private String typeId;
	private List<String> colors;
	private List<String> sizes;
	private String primaryImageUrl;
	private Boolean isPreorder;
	private Integer preorderDays;
}
