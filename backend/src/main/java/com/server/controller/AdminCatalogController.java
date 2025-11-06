package com.server.controller;

import com.server.entity.*;
import com.server.service.CatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminCatalogController {

    private final CatalogService catalogService;

    public AdminCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    // Categories
    @PostMapping("/categories")
    public Category createCategory(@RequestBody Category category) { return catalogService.createCategory(category); }

    @GetMapping("/categories")
    public Page<Category> listCategories(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("categoryName").ascending());
        return catalogService.listCategories(pageable);
    }

    @PutMapping("/categories/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category category) { return catalogService.updateCategory(id, category); }

    @DeleteMapping("/categories/{id}")
    public void deleteCategory(@PathVariable Long id) { catalogService.deleteCategory(id); }

    // Product Types
    @PostMapping("/product-types")
    public ProductType createProductType(@RequestBody ProductType type) { return catalogService.createProductType(type); }

    @GetMapping("/product-types")
    public Page<ProductType> listProductTypes(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("typeName").ascending());
        return catalogService.listProductTypes(pageable);
    }

    @PutMapping("/product-types/{id}")
    public ProductType updateProductType(@PathVariable Long id, @RequestBody ProductType type) { return catalogService.updateProductType(id, type); }

    @DeleteMapping("/product-types/{id}")
    public void deleteProductType(@PathVariable Long id) { catalogService.deleteProductType(id); }

    // Products
    @PostMapping("/products")
    public Product createProduct(@RequestBody Product product) { return catalogService.createProduct(product); }

    @GetMapping("/products")
    public Page<Product> listProducts(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @RequestParam(defaultValue = "createdAt") String sort,
                                      @RequestParam(defaultValue = "DESC") String dir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return catalogService.listProducts(pageable);
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product product) { return catalogService.updateProduct(id, product); }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable Long id) { catalogService.deleteProduct(id); }

    // Variants
    @PostMapping("/product-variants")
    public ProductVariant createVariant(@RequestBody ProductVariant variant) { return catalogService.createVariant(variant); }

    @PutMapping("/product-variants/{id}")
    public ProductVariant updateVariant(@PathVariable Long id, @RequestBody ProductVariant variant) { return catalogService.updateVariant(id, variant); }

    @DeleteMapping("/product-variants/{id}")
    public void deleteVariant(@PathVariable Long id) { catalogService.deleteVariant(id); }

    // Media
    @PostMapping("/product-media")
    public ProductMedia createMedia(@RequestBody ProductMedia media) { return catalogService.createMedia(media); }

    @DeleteMapping("/product-media/{id}")
    public void deleteMedia(@PathVariable Long id) { catalogService.deleteMedia(id); }
}


