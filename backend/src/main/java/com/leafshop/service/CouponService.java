package com.leafshop.service;

import com.leafshop.dto.coupon.ApplyCouponRequest;
import com.leafshop.dto.coupon.ApplyCouponResponse;
import com.leafshop.dto.coupon.CouponRequest;
import com.leafshop.dto.coupon.CouponResponse;
import com.leafshop.dto.coupon.CouponUsageResponse;
import com.leafshop.model.dynamodb.CouponTable;
import com.leafshop.repository.CouponTableRepository;
import com.leafshop.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponTableRepository couponTableRepository;

    public CouponResponse createCoupon(CouponRequest request) {
        String normalizedCode = request.getCouponCode().trim().toUpperCase();
        if (couponTableRepository.findByCouponCode(normalizedCode).isPresent()) {
            throw new IllegalArgumentException("Coupon already exists with code " + normalizedCode);
        }

        long now = Instant.now().toEpochMilli();
        Long validFrom = parseDateToEpoch(request.getValidFrom());
        Long validUntil = parseDateToEpoch(request.getValidUntil());

        CouponTable item = CouponTable.builder()
            .pk(DynamoDBKeyUtil.couponPk(normalizedCode))
            .sk(DynamoDBKeyUtil.couponMetaSk())
            .itemType("Coupon")
            .couponCode(normalizedCode)
            .couponName(request.getCouponName())
            .description(request.getDescription())
            .discountType(request.getDiscountType())
            .discountValue(request.getDiscountValue())
            .minPurchaseAmount(request.getMinPurchaseAmount())
            .maxDiscountAmount(request.getMaxDiscountAmount())
            .usageLimit(request.getUsageLimit())
            .usageLimitPerUser(request.getUsageLimitPerUser())
            .usedCount(0)
            .validFrom(validFrom)
            .validUntil(validUntil)
            .isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
            .applicableProducts(request.getApplicableProducts())
            .applicableCategories(request.getApplicableCategories())
            .excludedProducts(request.getExcludedProducts())
            .createdAt(now)
            .updatedAt(now)
            .build();

        couponTableRepository.save(item);
        return toResponse(item);
    }

    public CouponResponse updateCoupon(String couponCode, CouponRequest request) {
        String normalizedCode = couponCode.trim().toUpperCase();
        String pk = DynamoDBKeyUtil.couponPk(normalizedCode);
        CouponTable existing = couponTableRepository.findCouponMetaByPkAndSk(pk, DynamoDBKeyUtil.couponMetaSk())
            .orElseThrow(() -> new IllegalArgumentException("Coupon not found with code " + normalizedCode));

        long now = Instant.now().toEpochMilli();
        CouponTable updated = mergeCoupon(existing, request, now);
        couponTableRepository.save(updated);
        return toResponse(updated);
    }

    public CouponResponse getCoupon(String couponCode) {
        String normalizedCode = couponCode.trim().toUpperCase();
        String pk = DynamoDBKeyUtil.couponPk(normalizedCode);
        CouponTable item = couponTableRepository.findCouponMetaByPkAndSk(pk, DynamoDBKeyUtil.couponMetaSk())
            .orElseThrow(() -> new IllegalArgumentException("Coupon not found with code " + normalizedCode));
        return toResponse(item);
    }

    public List<CouponResponse> listCoupons(Boolean isActive) {
        List<CouponTable> coupons;
        if (isActive != null) {
            if (isActive) {
                coupons = couponTableRepository.findByIsActiveTrue();
            } else {
                coupons = couponTableRepository.findAll().stream()
                    .filter(c -> !Boolean.TRUE.equals(c.getIsActive()))
                    .collect(Collectors.toList());
            }
        } else {
            coupons = couponTableRepository.findAll();
        }

        return coupons.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteCoupon(String couponCode) {
        String normalizedCode = couponCode.trim().toUpperCase();
        String pk = DynamoDBKeyUtil.couponPk(normalizedCode);
        CouponTable existing = couponTableRepository.findCouponMetaByPkAndSk(pk, DynamoDBKeyUtil.couponMetaSk())
            .orElseThrow(() -> new IllegalArgumentException("Coupon not found with code " + normalizedCode));
        couponTableRepository.deleteByPkAndSk(existing.getPk(), existing.getSk());
    }

    public List<CouponUsageResponse> listUsage(String couponCode) {
        String normalizedCode = couponCode.trim().toUpperCase();
        String pk = DynamoDBKeyUtil.couponPk(normalizedCode);
        return couponTableRepository.findCouponUsageByPk(pk).stream()
            .filter(i -> "CouponUsage".equals(i.getItemType()))
            .map(i -> CouponUsageResponse.builder()
                .orderId(i.getOrderId())
                .userId(i.getUserId())
                .appliedDiscountAmount(i.getAppliedDiscountAmount())
                .orderTotal(i.getOrderTotal())
                .createdAt(formatEpochToDate(i.getCreatedAt()))
                .build())
            .collect(Collectors.toList());
    }

    public ApplyCouponResponse applyCoupon(ApplyCouponRequest request) {
        String normalizedCode = request.getCouponCode().trim().toUpperCase();
        CouponTable meta = couponTableRepository.findByCouponCode(normalizedCode)
            .orElseThrow(() -> new IllegalArgumentException("Coupon not found with code " + normalizedCode));

        long now = Instant.now().toEpochMilli();

        // validate
        if (!Boolean.TRUE.equals(meta.getIsActive())) throw new IllegalArgumentException("Coupon is not active");
        if (meta.getValidFrom() != null && now < meta.getValidFrom()) throw new IllegalArgumentException("Coupon not yet valid");
        if (meta.getValidUntil() != null && now > meta.getValidUntil()) throw new IllegalArgumentException("Coupon has expired");
        if (meta.getUsageLimit() != null && meta.getUsedCount() != null && meta.getUsedCount() >= meta.getUsageLimit())
            throw new IllegalArgumentException("Coupon usage limit reached");

        // per-user usage
        if (meta.getUsageLimitPerUser() != null && StringUtils.hasText(request.getUserId())) {
            long usedByUser = couponTableRepository.findCouponUsageByPk(meta.getPk()).stream()
                .filter(u -> request.getUserId().equals(u.getUserId()))
                .count();
            if (usedByUser >= meta.getUsageLimitPerUser()) throw new IllegalArgumentException("Coupon usage limit per user reached");
        }

        // min purchase
        if (meta.getMinPurchaseAmount() != null && request.getOrderTotal() < meta.getMinPurchaseAmount())
            throw new IllegalArgumentException("Order does not meet minimum purchase amount for coupon");

        // compute discount
        double discount = 0.0;
        if ("PERCENTAGE".equalsIgnoreCase(meta.getDiscountType())) {
            discount = request.getOrderTotal() * (meta.getDiscountValue() / 100.0);
            if (meta.getMaxDiscountAmount() != null) discount = Math.min(discount, meta.getMaxDiscountAmount());
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(meta.getDiscountType())) {
            discount = meta.getDiscountValue() != null ? meta.getDiscountValue() : 0.0;
        }
        if (discount <= 0) throw new IllegalArgumentException("Coupon does not provide any discount");

        double newTotal = Math.max(0.0, request.getOrderTotal() - discount);

        // record usage
        CouponTable usage = CouponTable.builder()
            .pk(meta.getPk())
            .sk(DynamoDBKeyUtil.couponUsageSk(request.getOrderId()))
            .itemType("CouponUsage")
            .orderId(request.getOrderId())
            .userId(request.getUserId())
            .appliedDiscountAmount(discount)
            .orderTotal(request.getOrderTotal())
            .createdAt(now)
            .updatedAt(now)
            .build();
        couponTableRepository.save(usage);

        // increment usedCount on meta (create new object manually)
        CouponTable updatedMeta = CouponTable.builder()
            .pk(meta.getPk())
            .sk(meta.getSk())
            .itemType(meta.getItemType())
            .couponCode(meta.getCouponCode())
            .couponName(meta.getCouponName())
            .description(meta.getDescription())
            .discountType(meta.getDiscountType())
            .discountValue(meta.getDiscountValue())
            .minPurchaseAmount(meta.getMinPurchaseAmount())
            .maxDiscountAmount(meta.getMaxDiscountAmount())
            .usageLimit(meta.getUsageLimit())
            .usageLimitPerUser(meta.getUsageLimitPerUser())
            .usedCount((meta.getUsedCount() == null ? 0 : meta.getUsedCount()) + 1)
            .validFrom(meta.getValidFrom())
            .validUntil(meta.getValidUntil())
            .isActive(meta.getIsActive())
            .applicableProducts(meta.getApplicableProducts())
            .applicableCategories(meta.getApplicableCategories())
            .excludedProducts(meta.getExcludedProducts())
            .createdAt(meta.getCreatedAt())
            .updatedAt(now)
            .build();
        couponTableRepository.save(updatedMeta);

        return ApplyCouponResponse.builder()
            .couponCode(normalizedCode)
            .discountAmount(discount)
            .newTotal(newTotal)
            .orderId(request.getOrderId())
            .userId(request.getUserId())
            .build();
    }

    private CouponTable mergeCoupon(CouponTable existing, CouponRequest req, long updatedAt) {
        return CouponTable.builder()
            .pk(existing.getPk())
            .sk(existing.getSk())
            .itemType(existing.getItemType())
            .couponCode(existing.getCouponCode())
            .couponName(StringUtils.hasText(req.getCouponName()) ? req.getCouponName() : existing.getCouponName())
            .description(StringUtils.hasText(req.getDescription()) ? req.getDescription() : existing.getDescription())
            .discountType(StringUtils.hasText(req.getDiscountType()) ? req.getDiscountType() : existing.getDiscountType())
            .discountValue(req.getDiscountValue() != null ? req.getDiscountValue() : existing.getDiscountValue())
            .minPurchaseAmount(req.getMinPurchaseAmount() != null ? req.getMinPurchaseAmount() : existing.getMinPurchaseAmount())
            .maxDiscountAmount(req.getMaxDiscountAmount() != null ? req.getMaxDiscountAmount() : existing.getMaxDiscountAmount())
            .usageLimit(req.getUsageLimit() != null ? req.getUsageLimit() : existing.getUsageLimit())
            .usageLimitPerUser(req.getUsageLimitPerUser() != null ? req.getUsageLimitPerUser() : existing.getUsageLimitPerUser())
            .usedCount(existing.getUsedCount())
            .validFrom(req.getValidFrom() != null ? parseDateToEpoch(req.getValidFrom()) : existing.getValidFrom())
            .validUntil(req.getValidUntil() != null ? parseDateToEpoch(req.getValidUntil()) : existing.getValidUntil())
            .isActive(req.getIsActive() != null ? req.getIsActive() : existing.getIsActive())
            .applicableProducts(req.getApplicableProducts() != null ? req.getApplicableProducts() : existing.getApplicableProducts())
            .applicableCategories(req.getApplicableCategories() != null ? req.getApplicableCategories() : existing.getApplicableCategories())
            .excludedProducts(req.getExcludedProducts() != null ? req.getExcludedProducts() : existing.getExcludedProducts())
            .createdAt(existing.getCreatedAt())
            .updatedAt(updatedAt)
            .build();
    }

    private CouponResponse toResponse(CouponTable item) {
        return CouponResponse.builder()
            .couponCode(item.getCouponCode())
            .couponName(item.getCouponName())
            .description(item.getDescription())
            .discountType(item.getDiscountType())
            .discountValue(item.getDiscountValue())
            .minPurchaseAmount(item.getMinPurchaseAmount())
            .maxDiscountAmount(item.getMaxDiscountAmount())
            .usageLimit(item.getUsageLimit())
            .usageLimitPerUser(item.getUsageLimitPerUser())
            .usedCount(item.getUsedCount())
            .validFrom(formatEpochToDate(item.getValidFrom()))
            .validUntil(formatEpochToDate(item.getValidUntil()))
            .isActive(item.getIsActive())
            .applicableProducts(item.getApplicableProducts())
            .applicableCategories(item.getApplicableCategories())
            .excludedProducts(item.getExcludedProducts())
            .createdAt(formatEpochToDate(item.getCreatedAt()))
            .updatedAt(formatEpochToDate(item.getUpdatedAt()))
            .build();
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private Long parseDateToEpoch(String dateStr) {
        if (dateStr == null) return null;
        // normalize double slashes to single
        String normalized = dateStr.replaceAll("/{2,}", "/");
        LocalDate ld = LocalDate.parse(normalized, DATE_FORMATTER);
        return ld.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private String formatEpochToDate(Long epochMillis) {
        if (epochMillis == null) return null;
        return Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate().format(DATE_FORMATTER);
    }
}
