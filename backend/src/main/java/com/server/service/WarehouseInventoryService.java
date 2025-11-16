package com.server.service;

import com.server.dto.warehouse.InventoryAlertItem;
import com.server.dto.warehouse.LowStockAlertResponse;
import com.server.dto.warehouse.UpdateInventoryRequest;
import com.server.dto.warehouse.WarehouseInventoryRequest;
import com.server.dto.warehouse.WarehouseInventoryResponse;
import com.server.model.dynamodb.ProductTable;
import com.server.model.dynamodb.WarehouseTable;
import com.server.repository.ProductTableRepository;
import com.server.repository.WarehouseTableRepository;
import com.server.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseInventoryService {

	private final WarehouseTableRepository warehouseTableRepository;
	private final ProductTableRepository productTableRepository;

	public WarehouseInventoryResponse createInventory(String warehouseId, WarehouseInventoryRequest request) {
		// Verify warehouse exists
		String warehousePk = DynamoDBKeyUtil.warehousePk(warehouseId);
		warehouseTableRepository.findWarehouseByPk(warehousePk)
			.orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id " + warehouseId));

		// Verify product exists
		String productPk = DynamoDBKeyUtil.productPk(request.getProductId());
		Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
		if (product.isEmpty()) {
			throw new IllegalArgumentException("Product not found with id " + request.getProductId());
		}

		// Determine SK based on variantId
		String sk;
		if (StringUtils.hasText(request.getVariantId())) {
			// Verify variant exists
			String variantSk = DynamoDBKeyUtil.productVariantSk(request.getVariantId());
			Optional<ProductTable> variant = productTableRepository.findVariantByPkAndSk(productPk, variantSk);
			if (variant.isEmpty()) {
				throw new IllegalArgumentException("ProductVariant not found with id " + request.getVariantId());
			}
			sk = DynamoDBKeyUtil.warehouseVariantSk(request.getProductId(), request.getVariantId());
		} else {
			sk = DynamoDBKeyUtil.warehouseProductSk(request.getProductId());
		}

		// Check if inventory already exists
		Optional<WarehouseTable> existing = warehouseTableRepository.findProductInventoryByPkAndSk(warehousePk, sk);
		if (existing.isPresent()) {
			throw new IllegalArgumentException("Inventory already exists for this product/variant in warehouse " + warehouseId);
		}

		long now = Instant.now().toEpochMilli();
		int reservedQuantity = request.getReservedQuantity() != null ? request.getReservedQuantity() : 0;
		int availableQuantity = request.getQuantity() - reservedQuantity;

		WarehouseTable inventory = buildInventoryItem(warehouseId, request, reservedQuantity, availableQuantity, now, now);
		warehouseTableRepository.save(inventory);
		return toResponse(warehouseId, inventory);
	}

	public WarehouseInventoryResponse updateInventory(String warehouseId, String productId, String variantId, WarehouseInventoryRequest request) {
		String warehousePk = DynamoDBKeyUtil.warehousePk(warehouseId);
		String sk = StringUtils.hasText(variantId)
			? DynamoDBKeyUtil.warehouseVariantSk(productId, variantId)
			: DynamoDBKeyUtil.warehouseProductSk(productId);

		WarehouseTable existing = warehouseTableRepository.findProductInventoryByPkAndSk(warehousePk, sk)
			.orElseThrow(() -> new IllegalArgumentException("Inventory not found for product " + productId + 
				(StringUtils.hasText(variantId) ? " variant " + variantId : "") + " in warehouse " + warehouseId));

		long now = Instant.now().toEpochMilli();
		int reservedQuantity = request.getReservedQuantity() != null ? request.getReservedQuantity() : existing.getReservedQuantity();
		int availableQuantity = request.getQuantity() - reservedQuantity;

		WarehouseTable updated = mergeInventory(existing, request, reservedQuantity, availableQuantity, now);
		warehouseTableRepository.save(updated);
		return toResponse(warehouseId, updated);
	}

	public WarehouseInventoryResponse getInventory(String warehouseId, String productId, String variantId) {
		String warehousePk = DynamoDBKeyUtil.warehousePk(warehouseId);
		String sk = StringUtils.hasText(variantId)
			? DynamoDBKeyUtil.warehouseVariantSk(productId, variantId)
			: DynamoDBKeyUtil.warehouseProductSk(productId);

		WarehouseTable inventory = warehouseTableRepository.findProductInventoryByPkAndSk(warehousePk, sk)
			.orElseThrow(() -> new IllegalArgumentException("Inventory not found for product " + productId + 
				(StringUtils.hasText(variantId) ? " variant " + variantId : "") + " in warehouse " + warehouseId));
		return toResponse(warehouseId, inventory);
	}

	public List<WarehouseInventoryResponse> listInventory(String warehouseId, String productId) {
		String warehousePk = DynamoDBKeyUtil.warehousePk(warehouseId);
		
		// Verify warehouse exists
		warehouseTableRepository.findWarehouseByPk(warehousePk)
			.orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id " + warehouseId));

		List<WarehouseTable> inventoryList = warehouseTableRepository.findInventoryByPk(warehousePk);

		if (StringUtils.hasText(productId)) {
			String productSk = DynamoDBKeyUtil.warehouseProductSk(productId);
			inventoryList = inventoryList.stream()
				.filter(item -> item.getSk().equals(productSk) || item.getSk().startsWith(productSk + "#VARIANT#"))
				.collect(Collectors.toList());
		}

		return inventoryList.stream()
			.map(item -> toResponse(warehouseId, item))
			.collect(Collectors.toList());
	}

	public void deleteInventory(String warehouseId, String productId, String variantId) {
		String warehousePk = DynamoDBKeyUtil.warehousePk(warehouseId);
		String sk = StringUtils.hasText(variantId)
			? DynamoDBKeyUtil.warehouseVariantSk(productId, variantId)
			: DynamoDBKeyUtil.warehouseProductSk(productId);

		WarehouseTable inventory = warehouseTableRepository.findProductInventoryByPkAndSk(warehousePk, sk)
			.orElseThrow(() -> new IllegalArgumentException("Inventory not found for product " + productId + 
				(StringUtils.hasText(variantId) ? " variant " + variantId : "") + " in warehouse " + warehouseId));
		warehouseTableRepository.deleteByPkAndSk(inventory.getPk(), inventory.getSk());
	}

	public WarehouseInventoryResponse updateInventoryQuantity(UpdateInventoryRequest request) {
		String warehousePk = DynamoDBKeyUtil.warehousePk(request.getWarehouseId());
		String sk = StringUtils.hasText(request.getVariantId())
			? DynamoDBKeyUtil.warehouseVariantSk(request.getProductId(), request.getVariantId())
			: DynamoDBKeyUtil.warehouseProductSk(request.getProductId());

		WarehouseTable inventory = warehouseTableRepository.findProductInventoryByPkAndSk(warehousePk, sk)
			.orElseThrow(() -> new IllegalArgumentException("Inventory not found for product " + request.getProductId() + 
				(StringUtils.hasText(request.getVariantId()) ? " variant " + request.getVariantId() : "") + " in warehouse " + request.getWarehouseId()));

		int newQuantity = inventory.getQuantity() + request.getQuantityChange();
		if (newQuantity < 0) {
			throw new IllegalArgumentException("Insufficient inventory. Current quantity: " + inventory.getQuantity() + 
				", requested change: " + request.getQuantityChange());
		}

		// Nếu là xuất hàng (quantityChange < 0), có thể cần cập nhật reservedQuantity
		int reservedQuantity = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity() : 0;
		if (request.getQuantityChange() < 0 && "ORDER".equals(request.getReason())) {
			// Khi xuất hàng cho đơn hàng, giảm reservedQuantity
			reservedQuantity = Math.max(0, reservedQuantity + request.getQuantityChange());
		}

		int availableQuantity = newQuantity - reservedQuantity;

		long now = Instant.now().toEpochMilli();
		WarehouseTable updated = WarehouseTable.builder()
			.pk(inventory.getPk())
			.sk(inventory.getSk())
			.itemType(inventory.getItemType())
			.productId(inventory.getProductId())
			.variantId(inventory.getVariantId())
			.quantity(newQuantity)
			.reservedQuantity(reservedQuantity)
			.availableQuantity(availableQuantity)
			.reorderPoint(inventory.getReorderPoint())
			.maxStock(inventory.getMaxStock())
			.location(inventory.getLocation())
			.createdAt(inventory.getCreatedAt())
			.updatedAt(now)
			.build();

		warehouseTableRepository.save(updated);
		return toResponse(request.getWarehouseId(), updated);
	}

	public LowStockAlertResponse getLowStockAlerts(String warehouseId) {
		String warehousePk = DynamoDBKeyUtil.warehousePk(warehouseId);
		WarehouseTable warehouse = warehouseTableRepository.findWarehouseByPk(warehousePk)
			.orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id " + warehouseId));

		List<WarehouseTable> inventoryList = warehouseTableRepository.findInventoryByPk(warehousePk);
		List<InventoryAlertItem> alertItems = new ArrayList<>();

		for (WarehouseTable inventory : inventoryList) {
			if (inventory.getReorderPoint() != null && inventory.getAvailableQuantity() != null) {
				if (inventory.getAvailableQuantity() <= inventory.getReorderPoint()) {
					// Get product name
					String productName = "Unknown";
					if (inventory.getProductId() != null) {
						String productPk = DynamoDBKeyUtil.productPk(inventory.getProductId());
						Optional<ProductTable> product = productTableRepository.findProductByPk(productPk);
						if (product.isPresent()) {
							productName = product.get().getName();
						}
					}

					alertItems.add(InventoryAlertItem.builder()
						.productId(inventory.getProductId())
						.variantId(inventory.getVariantId())
						.productName(productName)
						.currentQuantity(inventory.getQuantity())
						.reorderPoint(inventory.getReorderPoint())
						.availableQuantity(inventory.getAvailableQuantity())
						.location(inventory.getLocation())
						.build());
				}
			}
		}

		return LowStockAlertResponse.builder()
			.warehouseId(warehouseId)
			.warehouseName(warehouse.getWarehouseName())
			.alertItems(alertItems)
			.totalAlerts(alertItems.size())
			.build();
	}

	public List<LowStockAlertResponse> getAllLowStockAlerts() {
		List<WarehouseTable> warehouses = warehouseTableRepository.findByIsActiveTrue();
		return warehouses.stream()
			.map(w -> {
				String warehouseId = w.getPk().substring(11);
				return getLowStockAlerts(warehouseId);
			})
			.filter(alert -> alert.getTotalAlerts() > 0)
			.collect(Collectors.toList());
	}

	private WarehouseTable buildInventoryItem(String warehouseId, WarehouseInventoryRequest request, 
		int reservedQuantity, int availableQuantity, long createdAt, long updatedAt) {
		return WarehouseTable.builder()
			.pk(DynamoDBKeyUtil.warehousePk(warehouseId))
			.sk(StringUtils.hasText(request.getVariantId())
				? DynamoDBKeyUtil.warehouseVariantSk(request.getProductId(), request.getVariantId())
				: DynamoDBKeyUtil.warehouseProductSk(request.getProductId()))
			.itemType("Inventory")
			.productId(request.getProductId())
			.variantId(request.getVariantId())
			.quantity(request.getQuantity())
			.reservedQuantity(reservedQuantity)
			.availableQuantity(availableQuantity)
			.reorderPoint(request.getReorderPoint())
			.maxStock(request.getMaxStock())
			.location(request.getLocation())
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private WarehouseTable mergeInventory(WarehouseTable existing, WarehouseInventoryRequest request, 
		int reservedQuantity, int availableQuantity, long updatedAt) {
		return WarehouseTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.productId(existing.getProductId())
			.variantId(existing.getVariantId())
			.quantity(request.getQuantity() != null ? request.getQuantity() : existing.getQuantity())
			.reservedQuantity(reservedQuantity)
			.availableQuantity(availableQuantity)
			.reorderPoint(request.getReorderPoint() != null ? request.getReorderPoint() : existing.getReorderPoint())
			.maxStock(request.getMaxStock() != null ? request.getMaxStock() : existing.getMaxStock())
			.location(StringUtils.hasText(request.getLocation()) ? request.getLocation() : existing.getLocation())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private WarehouseInventoryResponse toResponse(String warehouseId, WarehouseTable item) {
		return WarehouseInventoryResponse.builder()
			.warehouseId(warehouseId)
			.productId(item.getProductId())
			.variantId(item.getVariantId())
			.quantity(item.getQuantity())
			.reservedQuantity(item.getReservedQuantity())
			.availableQuantity(item.getAvailableQuantity())
			.reorderPoint(item.getReorderPoint())
			.maxStock(item.getMaxStock())
			.location(item.getLocation())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

