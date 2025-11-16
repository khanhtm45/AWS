package com.server.service;

import com.server.dto.warehouse.WarehouseRequest;
import com.server.dto.warehouse.WarehouseResponse;
import com.server.model.dynamodb.WarehouseTable;
import com.server.repository.WarehouseTableRepository;
import com.server.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService {

	private final WarehouseTableRepository warehouseTableRepository;

	public WarehouseResponse createWarehouse(WarehouseRequest request) {
		String pk = DynamoDBKeyUtil.warehousePk(request.getWarehouseId());
		Optional<WarehouseTable> existing = warehouseTableRepository.findWarehouseMetaByPkAndSk(pk, DynamoDBKeyUtil.warehouseMetaSk());
		if (existing.isPresent()) {
			throw new IllegalArgumentException("Warehouse already exists with id " + request.getWarehouseId());
		}

		long now = Instant.now().toEpochMilli();
		WarehouseTable warehouse = buildWarehouseItem(request, now, now);
		warehouseTableRepository.save(warehouse);
		return toResponse(warehouse);
	}

	public WarehouseResponse updateWarehouse(String warehouseId, WarehouseRequest request) {
		String pk = DynamoDBKeyUtil.warehousePk(warehouseId);
		WarehouseTable existing = warehouseTableRepository.findWarehouseMetaByPkAndSk(pk, DynamoDBKeyUtil.warehouseMetaSk())
			.orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id " + warehouseId));

		long now = Instant.now().toEpochMilli();
		WarehouseTable updated = mergeWarehouse(existing, request, now);
		warehouseTableRepository.save(updated);
		return toResponse(updated);
	}

	public WarehouseResponse getWarehouse(String warehouseId) {
		String pk = DynamoDBKeyUtil.warehousePk(warehouseId);
		WarehouseTable warehouse = warehouseTableRepository.findWarehouseMetaByPkAndSk(pk, DynamoDBKeyUtil.warehouseMetaSk())
			.orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id " + warehouseId));
		return toResponse(warehouse);
	}

	public List<WarehouseResponse> listWarehouses(Boolean isActive) {
		List<WarehouseTable> warehouses;
		if (isActive != null) {
			if (isActive) {
				warehouses = warehouseTableRepository.findByIsActiveTrue();
			} else {
				warehouses = warehouseTableRepository.findAll().stream()
					.filter(w -> !Boolean.TRUE.equals(w.getIsActive()))
					.collect(Collectors.toList());
			}
		} else {
			warehouses = warehouseTableRepository.findAll();
		}

		return warehouses.stream()
			.map(this::toResponse)
			.collect(Collectors.toList());
	}

	public void deleteWarehouse(String warehouseId) {
		String pk = DynamoDBKeyUtil.warehousePk(warehouseId);
		WarehouseTable warehouse = warehouseTableRepository.findWarehouseMetaByPkAndSk(pk, DynamoDBKeyUtil.warehouseMetaSk())
			.orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id " + warehouseId));
		warehouseTableRepository.deleteByPkAndSk(warehouse.getPk(), warehouse.getSk());
	}

	private WarehouseTable buildWarehouseItem(WarehouseRequest request, long createdAt, long updatedAt) {
		return WarehouseTable.builder()
			.pk(DynamoDBKeyUtil.warehousePk(request.getWarehouseId()))
			.sk(DynamoDBKeyUtil.warehouseMetaSk())
			.itemType("Warehouse")
			.warehouseName(request.getWarehouseName())
			.address(request.getAddress())
			.city(request.getCity())
			.province(request.getProvince())
			.postalCode(request.getPostalCode())
			.country(request.getCountry())
			.phoneNumber(request.getPhoneNumber())
			.managerId(request.getManagerId())
			.isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
			.createdAt(createdAt)
			.updatedAt(updatedAt)
			.build();
	}

	private WarehouseTable mergeWarehouse(WarehouseTable existing, WarehouseRequest request, long updatedAt) {
		return WarehouseTable.builder()
			.pk(existing.getPk())
			.sk(existing.getSk())
			.itemType(existing.getItemType())
			.warehouseName(StringUtils.hasText(request.getWarehouseName()) ? request.getWarehouseName() : existing.getWarehouseName())
			.address(StringUtils.hasText(request.getAddress()) ? request.getAddress() : existing.getAddress())
			.city(StringUtils.hasText(request.getCity()) ? request.getCity() : existing.getCity())
			.province(StringUtils.hasText(request.getProvince()) ? request.getProvince() : existing.getProvince())
			.postalCode(StringUtils.hasText(request.getPostalCode()) ? request.getPostalCode() : existing.getPostalCode())
			.country(StringUtils.hasText(request.getCountry()) ? request.getCountry() : existing.getCountry())
			.phoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber() : existing.getPhoneNumber())
			.managerId(StringUtils.hasText(request.getManagerId()) ? request.getManagerId() : existing.getManagerId())
			.isActive(request.getIsActive() != null ? request.getIsActive() : existing.getIsActive())
			.createdAt(existing.getCreatedAt())
			.updatedAt(updatedAt)
			.build();
	}

	private WarehouseResponse toResponse(WarehouseTable item) {
		String warehouseId = item.getPk() != null && item.getPk().startsWith("WAREHOUSE#")
			? item.getPk().substring(11)
			: null;

		return WarehouseResponse.builder()
			.warehouseId(warehouseId)
			.warehouseName(item.getWarehouseName())
			.address(item.getAddress())
			.city(item.getCity())
			.province(item.getProvince())
			.postalCode(item.getPostalCode())
			.country(item.getCountry())
			.phoneNumber(item.getPhoneNumber())
			.managerId(item.getManagerId())
			.isActive(item.getIsActive())
			.createdAt(item.getCreatedAt())
			.updatedAt(item.getUpdatedAt())
			.build();
	}
}

