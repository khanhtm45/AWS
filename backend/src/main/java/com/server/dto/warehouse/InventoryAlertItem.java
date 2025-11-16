package com.server.dto.warehouse;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InventoryAlertItem {
	String productId;
	String variantId;
	String productName;
	Integer currentQuantity;
	Integer reorderPoint;
	Integer availableQuantity;
	String location;
}

