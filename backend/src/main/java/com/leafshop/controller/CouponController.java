package com.leafshop.controller;

import com.leafshop.dto.coupon.ApplyCouponRequest;
import com.leafshop.dto.coupon.ApplyCouponResponse;
import com.leafshop.dto.coupon.CouponRequest;
import com.leafshop.dto.coupon.CouponResponse;
import com.leafshop.dto.coupon.CouponUsageResponse;
import com.leafshop.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@Validated
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.createCoupon(request));
    }

    @PutMapping("/{couponCode}")
    public ResponseEntity<CouponResponse> updateCoupon(
        @PathVariable String couponCode,
        @Valid @RequestBody CouponRequest request
    ) {
        return ResponseEntity.ok(couponService.updateCoupon(couponCode, request));
    }

    @GetMapping("/{couponCode}")
    public ResponseEntity<CouponResponse> getCoupon(@PathVariable String couponCode) {
        return ResponseEntity.ok(couponService.getCoupon(couponCode));
    }

    @GetMapping
    public ResponseEntity<List<CouponResponse>> listCoupons(@RequestParam(required = false) Boolean isActive) {
        return ResponseEntity.ok(couponService.listCoupons(isActive));
    }

    @DeleteMapping("/{couponCode}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable String couponCode) {
        couponService.deleteCoupon(couponCode);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/apply")
    public ResponseEntity<ApplyCouponResponse> applyCoupon(@Valid @RequestBody ApplyCouponRequest request) {
        return ResponseEntity.ok(couponService.applyCoupon(request));
    }

    @GetMapping("/{couponCode}/usage")
    public ResponseEntity<List<CouponUsageResponse>> listUsage(@PathVariable String couponCode) {
        return ResponseEntity.ok(couponService.listUsage(couponCode));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}

