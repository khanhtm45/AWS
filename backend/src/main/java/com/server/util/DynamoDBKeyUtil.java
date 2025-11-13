package com.server.util;

/**
 * Utility class để tạo Partition Key (PK) và Sort Key (SK) cho DynamoDB tables
 * theo pattern đã thiết kế
 */
public class DynamoDBKeyUtil {

    // UserTable keys
    public static String userPk(String userId) {
        return "USER#" + userId;
    }

    public static String userMetaSk() {
        return "META";
    }

    public static String userAccountSk() {
        return "ACCOUNT";
    }

    public static String userTokenSk(String tokenId) {
        return "TOKEN#" + tokenId;
    }

    public static String userAddressSk(String addressId) {
        return "ADDRESS#" + addressId;
    }

    public static String userEmployeeSk(String employeeId) {
        return "EMPLOYEE#" + employeeId;
    }

    // ProductTable keys
    public static String productPk(String productId) {
        return "PRODUCT#" + productId;
    }

    public static String productMetaSk() {
        return "META";
    }

    public static String productVariantSk(String variantId) {
        return "VARIANT#" + variantId;
    }

    public static String productMediaSk(String mediaId) {
        return "MEDIA#" + mediaId;
    }

    public static String categoryPk(String categoryId) {
        return "CATEGORY#" + categoryId;
    }

    public static String categoryMetaSk() {
        return "META";
    }

    public static String typePk(String typeId) {
        return "TYPE#" + typeId;
    }

    public static String typeMetaSk() {
        return "META";
    }

    // OrderTable keys
    public static String userOrderPk(String userId, String orderId) {
        return "USER#" + userId + "#ORDER#" + orderId;
    }

    public static String orderPk(String orderId) {
        return "ORDER#" + orderId;
    }

    public static String orderMetaSk() {
        return "META";
    }

    public static String orderItemSk(String itemId) {
        return "ITEM#" + itemId;
    }

    public static String orderPaymentSk() {
        return "PAYMENT";
    }

    public static String orderDiscountSk() {
        return "DISCOUNT";
    }

    public static String userCartPk(String userId) {
        return "CART#" + userId;
    }

    public static String guestCartPk(String sessionId) {
        return "CART#GUEST#" + sessionId;
    }

    public static String cartMetaSk() {
        return "META";
    }

    // WarehouseTable keys
    public static String warehousePk(String warehouseId) {
        return "WAREHOUSE#" + warehouseId;
    }

    public static String warehouseMetaSk() {
        return "META";
    }

    public static String warehouseProductSk(String productId) {
        return "PRODUCT#" + productId;
    }

    public static String warehouseVariantSk(String productId, String variantId) {
        return "PRODUCT#" + productId + "#VARIANT#" + variantId;
    }

    // ReviewTable keys
    public static String productReviewPk(String productId) {
        return "PRODUCT#" + productId;
    }

    public static String userReviewPk(String userId) {
        return "USER#" + userId;
    }

    public static String reviewSk(String reviewId) {
        return "REVIEW#" + reviewId;
    }

    // BlogTable keys
    public static String blogPostPk(String postId) {
        return "POST#" + postId;
    }

    public static String blogMetaSk() {
        return "META";
    }

    // CouponTable keys
    public static String couponPk(String couponCode) {
        return "COUPON#" + couponCode;
    }

    public static String couponMetaSk() {
        return "META";
    }

    public static String couponUsageSk(String orderId) {
        return "USAGE#" + orderId;
    }
}

