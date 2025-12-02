package com.leafshop.controller;

import com.leafshop.dto.size.SizeTableResponse;
import com.leafshop.service.SizeTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sizes")
@RequiredArgsConstructor
public class SizeTableController {
    
    private final SizeTableService sizeTableService;
    
    @GetMapping
    public ResponseEntity<List<SizeTableResponse>> getAllSizes() {
        List<SizeTableResponse> sizes = sizeTableService.getAllActiveSizes();
        return ResponseEntity.ok(sizes);
    }
    
    @GetMapping("/{sizeId}")
    public ResponseEntity<SizeTableResponse> getSizeById(@PathVariable String sizeId) {
        SizeTableResponse size = sizeTableService.getSizeById(sizeId);
        return ResponseEntity.ok(size);
    }
    
    @GetMapping("/name/{sizeName}")
    public ResponseEntity<SizeTableResponse> getSizeBySizeName(@PathVariable String sizeName) {
        SizeTableResponse size = sizeTableService.getSizeBySizeName(sizeName);
        return ResponseEntity.ok(size);
    }
}