package com.leafshop.dto.warehouse;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class WarehouseInventoryResponse {
	String warehouseId;
	String productId;
	String variantId;
	Integer quantity;
	Integer reservedQuantity;
	Integer availableQuantity;
	Integer reorderPoint;
	Integer maxStock;
	String location;
	Long createdAt;
	Long updatedAt;
}

