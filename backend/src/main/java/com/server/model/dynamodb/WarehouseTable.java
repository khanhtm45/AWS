package com.server.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

/**
 * WarehouseTable - Quản lý kho và tồn kho sản phẩm
 * PK: WAREHOUSE#<warehouse_id>
 * SK: META | PRODUCT#<product_id> | PRODUCT#<product_id>#VARIANT#<variant_id>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class WarehouseTable {

    private String pk; // WAREHOUSE#<warehouse_id>

    private String sk; // META | PRODUCT#<product_id> | PRODUCT#<product_id>#VARIANT#<variant_id>

    private String itemType; // Warehouse, Inventory

    // WAREHOUSE META fields
    private String warehouseName;

    private String address;

    private String city;

    private String province;

    private String postalCode;

    private String country;

    private String phoneNumber;

    private String managerId;

    private Boolean isActive;

    // INVENTORY fields
    private String productId;

    private String variantId;

    private Integer quantity;

    private Integer reservedQuantity; // Số lượng đã được đặt hàng nhưng chưa giao

    private Integer availableQuantity; // quantity - reserved_quantity

    private Integer reorderPoint; // Mức tồn kho tối thiểu để đặt hàng lại

    private Integer maxStock; // Mức tồn kho tối đa

    private String location; // Vị trí trong kho (kệ, khu vực)

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
