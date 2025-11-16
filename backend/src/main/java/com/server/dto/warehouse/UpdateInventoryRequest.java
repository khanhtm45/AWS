package com.server.dto.warehouse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateInventoryRequest {

	@NotBlank
	private String warehouseId;

	@NotBlank
	private String productId;

	private String variantId; // Optional

	@NotNull
	private Integer quantityChange; // Số lượng thay đổi (dương = nhập hàng, âm = xuất hàng)

	private String reason; // Lý do: "ORDER", "RESTOCK", "ADJUSTMENT", etc.
}

