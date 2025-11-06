package com.server.controller;

import com.server.entity.Product;
import com.server.entity.ProductMedia;
import com.server.entity.ProductVariant;
import com.server.service.CatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/products")
    public Page<Product> listProducts(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) Long categoryId,
                                      @RequestParam(required = false) Long typeId,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @RequestParam(defaultValue = "createdAt") String sort,
                                      @RequestParam(defaultValue = "DESC") String dir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return catalogService.searchProducts(q, categoryId, typeId, pageable);
    }

    @GetMapping("/products/{id}")
    public Product getProduct(@PathVariable Long id) {
        return catalogService.getProduct(id);
    }

    @GetMapping("/products/{id}/variants")
    public List<ProductVariant> listVariants(@PathVariable Long id) {
        Product p = catalogService.getProduct(id);
        return catalogService.listVariantsByProduct(p);
    }

    @GetMapping("/products/{id}/media")
    public List<ProductMedia> listMedia(@PathVariable Long id) {
        Product p = catalogService.getProduct(id);
        return catalogService.listMediaByProduct(p);
    }
}


