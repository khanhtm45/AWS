package com.server.dto.warehouse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WarehouseInventoryRequest {

	@NotBlank
	private String productId;

	private String variantId; // Optional - nếu null thì là inventory cho product, nếu có thì là inventory cho variant

	@NotNull
	private Integer quantity;

	private Integer reservedQuantity; // Số lượng đã được đặt hàng nhưng chưa giao

	private Integer reorderPoint; // Mức tồn kho tối thiểu để đặt hàng lại

	private Integer maxStock; // Mức tồn kho tối đa

	private String location; // Vị trí trong kho (kệ, khu vực)
}

