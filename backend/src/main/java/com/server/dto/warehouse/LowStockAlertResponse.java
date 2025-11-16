package com.server.dto.warehouse;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class LowStockAlertResponse {
	String warehouseId;
	String warehouseName;
	List<InventoryAlertItem> alertItems;
	int totalAlerts;
}

