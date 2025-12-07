package com.leafshop.controller;

import com.leafshop.dto.chatbot.ProductSuggestionRequest;
import com.leafshop.dto.chatbot.ProductSuggestionResponse;
import com.leafshop.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

	private final ChatbotService chatbotService;

	/**
	 * Gợi ý sản phẩm dựa trên text query từ chatbot
	 * Endpoint này được gọi từ AWS Lambda function
	 */
	@PostMapping("/suggest-products")
	public ResponseEntity<List<ProductSuggestionResponse>> suggestProducts(
		@RequestBody ProductSuggestionRequest request
	) {
		List<ProductSuggestionResponse> suggestions = chatbotService.suggestProducts(
			request.getQuery(),
			request.getLimit()
		);
		return ResponseEntity.ok(suggestions);
	}

	/**
	 * Alternative GET endpoint for simple queries
	 */
	@GetMapping("/suggest-products")
	public ResponseEntity<List<ProductSuggestionResponse>> suggestProductsGet(
		@RequestParam String query,
		@RequestParam(required = false, defaultValue = "5") Integer limit
	) {
		List<ProductSuggestionResponse> suggestions = chatbotService.suggestProducts(query, limit);
		return ResponseEntity.ok(suggestions);
	}
}
