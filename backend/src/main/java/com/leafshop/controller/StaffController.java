package com.leafshop.controller;

import com.leafshop.dto.staff.CustomerResponse;
import com.leafshop.dto.staff.CustomerPurchaseHistoryResponse;
import com.leafshop.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    // 1. Lấy danh sách tất cả khách hàng
    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers() {
        try {
            List<CustomerResponse> customers = staffService.getAllCustomers();
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 2. Lấy lịch sử mua hàng của khách hàng
    @GetMapping("/customers/{userId}/purchase-history")
    public ResponseEntity<CustomerPurchaseHistoryResponse> getCustomerPurchaseHistory(
            @PathVariable String userId) {
        try {
            CustomerPurchaseHistoryResponse response = staffService.getCustomerPurchaseHistory(userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

