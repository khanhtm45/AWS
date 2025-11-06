package com.server.service;

import com.server.entity.*;
import com.server.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final ProductTypeRepository productTypeRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMediaRepository productMediaRepository;

    public CatalogService(CategoryRepository categoryRepository,
                          ProductTypeRepository productTypeRepository,
                          ProductRepository productRepository,
                          ProductVariantRepository productVariantRepository,
                          ProductMediaRepository productMediaRepository) {
        this.categoryRepository = categoryRepository;
        this.productTypeRepository = productTypeRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.productMediaRepository = productMediaRepository;
    }

    // Categories
    public Category createCategory(Category category) { return categoryRepository.save(category); }
    public Category getCategory(Long id) { return categoryRepository.findById(id).orElseThrow(); }
    public Page<Category> listCategories(Pageable pageable) { return categoryRepository.findAll(pageable); }
    public Category updateCategory(Long id, Category data) {
        Category c = getCategory(id);
        c.setCategoryName(data.getCategoryName());
        c.setDescription(data.getDescription());
        c.setParentCategory(data.getParentCategory());
        return categoryRepository.save(c);
    }
    public void deleteCategory(Long id) { categoryRepository.deleteById(id); }

    // Product Types
    public ProductType createProductType(ProductType type) { return productTypeRepository.save(type); }
    public ProductType getProductType(Long id) { return productTypeRepository.findById(id).orElseThrow(); }
    public Page<ProductType> listProductTypes(Pageable pageable) { return productTypeRepository.findAll(pageable); }
    public ProductType updateProductType(Long id, ProductType data) {
        ProductType t = getProductType(id);
        t.setTypeName(data.getTypeName());
        t.setDescription(data.getDescription());
        return productTypeRepository.save(t);
    }
    public void deleteProductType(Long id) { productTypeRepository.deleteById(id); }

    // Products
    public Product createProduct(Product product) { return productRepository.save(product); }
    public Product getProduct(Long id) { return productRepository.findById(id).orElseThrow(); }
    public Page<Product> listProducts(Pageable pageable) { return productRepository.findAll(pageable); }
    public Product updateProduct(Long id, Product data) {
        Product p = getProduct(id);
        p.setName(data.getName());
        p.setDescription(data.getDescription());
        p.setPrice(data.getPrice());
        p.setSku(data.getSku());
        p.setCategory(data.getCategory());
        p.setProductType(data.getProductType());
        p.setImageUrl(data.getImageUrl());
        p.setIsPreorder(data.getIsPreorder());
        p.setPreorderStartDate(data.getPreorderStartDate());
        p.setPreorderEndDate(data.getPreorderEndDate());
        p.setEstimatedDeliveryDate(data.getEstimatedDeliveryDate());
        return productRepository.save(p);
    }
    public void deleteProduct(Long id) { productRepository.deleteById(id); }

    // Product Variants
    public ProductVariant createVariant(ProductVariant variant) { return productVariantRepository.save(variant); }
    public ProductVariant getVariant(Long id) { return productVariantRepository.findById(id).orElseThrow(); }
    public List<ProductVariant> listVariantsByProduct(Product product) { return productVariantRepository.findByProduct(product); }
    public ProductVariant updateVariant(Long id, ProductVariant data) {
        ProductVariant v = getVariant(id);
        v.setProduct(data.getProduct());
        v.setAttributeName(data.getAttributeName());
        v.setAttributeValue(data.getAttributeValue());
        v.setPriceAdjustment(data.getPriceAdjustment());
        v.setSkuVariant(data.getSkuVariant());
        return productVariantRepository.save(v);
    }
    public void deleteVariant(Long id) { productVariantRepository.deleteById(id); }

    // Product Media
    public ProductMedia createMedia(ProductMedia media) { return productMediaRepository.save(media); }
    public List<ProductMedia> listMediaByProduct(Product product) { return productMediaRepository.findByProduct(product); }
    public void deleteMedia(Long id) { productMediaRepository.deleteById(id); }

    // Public catalog search
    public Page<Product> searchProducts(String q, Long categoryId, Long typeId, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return productRepository.findByNameContainingIgnoreCase(q, pageable);
        }
        if (categoryId != null) {
            Category c = getCategory(categoryId);
            return productRepository.findByCategory(c, pageable);
        }
        if (typeId != null) {
            ProductType t = getProductType(typeId);
            return productRepository.findByProductType(t, pageable);
        }
        return productRepository.findAll(pageable);
    }
}


