package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.List;

/**
 * ProductTable - Quản lý sản phẩm, danh mục, loại sản phẩm, biến thể và media
 * PK: PRODUCT#<product_id> | CATEGORY#<category_id> | TYPE#<type_id>
 * SK: META | VARIANT#<variant_id> | MEDIA#<media_id>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class ProductTable {

    private String pk; // PRODUCT#<product_id> | CATEGORY#<category_id> | TYPE#<type_id>

    private String sk; // META | VARIANT#<variant_id> | MEDIA#<media_id>

    private String itemType; // Product, Variant, Media, Category, Type

    // PRODUCT META fields
    private String name;

    private String description;

    private Double price;

    private String categoryId;

    private String typeId;

    private Boolean isPreorder;

    private Integer preorderDays;

    private Boolean isActive;

    private List<String> tags;

    // VARIANT fields
    private String color; // Màu sắc của biến thể

    private String size; // Kích thước của biến thể

    private Double variantPrice; // Giá phụ (nếu khác với giá sản phẩm)

    private String sku;

    private String barcode;

    // MEDIA fields
    private String mediaUrl;

    private String s3Key;

    private String mediaType; // IMAGE, VIDEO

    private Integer mediaOrder;

    private Boolean isPrimary;

    // CATEGORY fields
    private String categoryName;

    private String parentCategoryId; // For hierarchical categories

    private Integer categoryLevel;

    private String categoryImage;

    // TYPE fields
    private String typeName; // Physical, Digital, Service

    private String typeDescription;

    // Common fields
    private Long createdAt;

    private Long updatedAt;

    @DynamoDbAttribute("PK")
    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbAttribute("SK")
    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }
}

