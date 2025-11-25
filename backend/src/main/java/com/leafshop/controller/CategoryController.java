package com.leafshop.controller;

import com.leafshop.dto.category.CategoryRequest;
import com.leafshop.dto.category.CategoryResponse;
import com.leafshop.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Validated
@RequiredArgsConstructor
public class CategoryController {

	private final CategoryService categoryService;

	@PostMapping
	public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
	}

	@PutMapping("/{categoryId}")
	public ResponseEntity<CategoryResponse> updateCategory(
		@PathVariable String categoryId,
		@Valid @RequestBody CategoryRequest request
	) {
		return ResponseEntity.ok(categoryService.updateCategory(categoryId, request));
	}

	@GetMapping("/{categoryId}")
	public ResponseEntity<CategoryResponse> getCategory(@PathVariable String categoryId) {
		return ResponseEntity.ok(categoryService.getCategory(categoryId));
	}

	@GetMapping
	public ResponseEntity<List<CategoryResponse>> listCategories(
		@RequestParam(required = false) String parentCategoryId,
		@RequestParam(required = false) Boolean isActive
	) {
		return ResponseEntity.ok(categoryService.listCategories(parentCategoryId, isActive));
	}

	@DeleteMapping("/{categoryId}")
	public ResponseEntity<Void> deleteCategory(@PathVariable String categoryId) {
		categoryService.deleteCategory(categoryId);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}


