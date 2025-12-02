package com.leafshop.service;

import com.leafshop.dto.size.SizeTableResponse;
import com.leafshop.model.dynamodb.SizeTable;
import com.leafshop.repository.SizeTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SizeTableService {
    
    private final SizeTableRepository sizeTableRepository;
    
    @PostConstruct
    public void initializeSizes() {
        // Kiểm tra nếu bảng size_table trống thì tạo 4 size mặc định
        if (sizeTableRepository.count() == 0) {
            createDefaultSizes();
        }
    }
    
    private void createDefaultSizes() {
        log.info("Initializing default sizes...");
        
        SizeTable sizeS = new SizeTable(UUID.randomUUID().toString(), "S", 1, true);
        SizeTable sizeM = new SizeTable(UUID.randomUUID().toString(), "M", 2, true);
        SizeTable sizeL = new SizeTable(UUID.randomUUID().toString(), "L", 3, true);
        SizeTable sizeXL = new SizeTable(UUID.randomUUID().toString(), "XL", 4, true);
        
        sizeTableRepository.saveAll(List.of(sizeS, sizeM, sizeL, sizeXL));
        
        log.info("Default sizes created: S, M, L, XL");
    }
    
    public List<SizeTableResponse> getAllActiveSizes() {
        return sizeTableRepository.findByIsActiveTrueOrderBySizeOrder()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public SizeTableResponse getSizeById(String sizeId) {
        SizeTable size = sizeTableRepository.findById(sizeId)
                .orElseThrow(() -> new RuntimeException("Size not found with id: " + sizeId));
        return mapToResponse(size);
    }
    
    public SizeTableResponse getSizeBySizeName(String sizeName) {
        SizeTable size = sizeTableRepository.findBySizeNameAndIsActiveTrue(sizeName)
                .orElseThrow(() -> new RuntimeException("Size not found: " + sizeName));
        return mapToResponse(size);
    }
    
    private SizeTableResponse mapToResponse(SizeTable size) {
        return new SizeTableResponse(
                size.getSizeId(),
                size.getSizeName(),
                size.getSizeOrder(),
                size.getIsActive()
        );
    }
}