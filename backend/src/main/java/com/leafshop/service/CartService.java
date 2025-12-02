package com.leafshop.service;

import com.leafshop.dto.cart.*;
import com.leafshop.dto.coupon.ApplyCouponRequest;
import com.leafshop.dto.coupon.ApplyCouponResponse;
import com.leafshop.dto.order.CreateOrderResponse;
import com.leafshop.model.dynamodb.OrderTable;
import com.leafshop.model.dynamodb.ProductTable;
import com.leafshop.repository.OrderTableRepository;
import com.leafshop.repository.ProductTableRepository;
import com.leafshop.repository.WarehouseTableRepository;
import com.leafshop.model.dynamodb.WarehouseTable;
import com.leafshop.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {



    private final OrderTableRepository orderTableRepository;
    private final ProductTableRepository productTableRepository;
    private final WarehouseTableRepository warehouseTableRepository;

    private String cartPk(String userId, String sessionId) {
        if (userId != null && !userId.isEmpty()) return "CART#" + userId;
        return "CART#GUEST#" + sessionId;
    }

    public CartResponse getOrCreateCart(String userId, String sessionId) {
        String pk = cartPk(userId, sessionId);

        Optional<OrderTable> metaOpt = orderTableRepository.findCartByPk(pk);
        if (!metaOpt.isPresent()) {
            OrderTable meta = OrderTable.builder()
                .pk(pk)
                .sk("META")
                .itemType("Cart")
                .userId(userId)
                .sessionId(sessionId)
                .subtotal(0.0)
                .shippingAmount(0.0)
                .discountAmount(0.0)
                .totalAmount(0.0)
                .createdAt(System.currentTimeMillis())
                .build();
            orderTableRepository.save(meta);
        }

        return buildCartResponse(pk, userId, sessionId, null);
    }

    public CartResponse getCart(String userId, String sessionId) {
        String pk = cartPk(userId, sessionId);
        return buildCartResponse(pk, userId, sessionId, null);
    }

    public CartResponse addItem(CartItemRequest req) {
        String pk = cartPk(req.getUserId(), req.getSessionId());

        // Ensure cart meta exists
        getOrCreateCart(req.getUserId(), req.getSessionId());

        // Load product price
        String productPk = "PRODUCT#" + req.getProductId();
        Optional<ProductTable> pMetaOpt = productTableRepository.findProductMetaByPkAndSk(productPk, "META");
        double unitPrice = 0.0;
        if (pMetaOpt.isPresent()) {
            ProductTable p = pMetaOpt.get();
            unitPrice = p.getPrice() != null ? p.getPrice() : 0.0;
            // check variant override
            if (req.getVariantId() != null) {
                Optional<ProductTable> varOpt = productTableRepository.findVariantByPkAndSk(productPk, "VARIANT#" + req.getVariantId());
                if (varOpt.isPresent()) {
                    ProductTable v = varOpt.get();
                    if (v.getVariantPrice() != null) unitPrice = v.getVariantPrice();
                }
            }
        }

        int quantity = req.getQuantity() != null ? req.getQuantity() : 1;

        // Check if same product+variant exists in cart; if so, increase quantity
        List<OrderTable> items = orderTableRepository.findOrderItemsByPk(pk);
        Optional<OrderTable> existing = items.stream()
            .filter(i -> req.getProductId().equals(i.getProductId())
                && Objects.equals(req.getVariantId(), i.getVariantId())
                && Objects.equals(req.getSize(), i.getSize()))
            .findFirst();

        String itemSk;
        if (existing.isPresent()) {
            OrderTable ex = existing.get();
            ex.setQuantity((ex.getQuantity() != null ? ex.getQuantity() : 0) + quantity);
            ex.setUnitPrice(unitPrice);
            ex.setItemTotal(ex.getUnitPrice() * ex.getQuantity());
            orderTableRepository.save(ex);
            itemSk = ex.getSk();
        } else {
            String itemId = UUID.randomUUID().toString();
            itemSk = "ITEM#" + itemId;
            OrderTable item = OrderTable.builder()
                .pk(pk)
                .sk(itemSk)
                .itemType("CartItem")
                .productId(req.getProductId())
                .variantId(req.getVariantId())
                .size(req.getSize())
                .quantity(quantity)
                .unitPrice(unitPrice)
                .itemTotal(unitPrice * quantity)
                .createdAt(System.currentTimeMillis())
                .build();
            orderTableRepository.save(item);
        }

        // Recompute totals
        return buildCartResponse(pk, req.getUserId(), req.getSessionId(), null);
    }

    public CartResponse updateItem(String userId, String sessionId, String itemId, Integer quantity) {
        String pk = cartPk(userId, sessionId);
        String sk = "ITEM#" + itemId;
        Optional<OrderTable> itemOpt = orderTableRepository.findItemByPkAndSk(pk, sk);
        if (itemOpt.isPresent()) {
            OrderTable item = itemOpt.get();
            item.setQuantity(quantity);
            item.setItemTotal((item.getUnitPrice() != null ? item.getUnitPrice() : 0.0) * quantity);
            orderTableRepository.save(item);
        }
        return buildCartResponse(pk, userId, sessionId, null);
    }

    public CartResponse deleteItem(String userId, String sessionId, String itemId) {
        String pk = cartPk(userId, sessionId);
        String sk = "ITEM#" + itemId;
        orderTableRepository.deleteByPkAndSk(pk, sk);
        return buildCartResponse(pk, userId, sessionId, null);
    }

    public CartResponse computeTotals(String userId, String sessionId, String couponCode) {
        String pk = cartPk(userId, sessionId);
        return buildCartResponse(pk, userId, sessionId, couponCode);
    }

    public CreateOrderResponse checkout(CheckoutRequest req) {
        // 1. Validate request parameters
        if (req.getUserId() == null && req.getSessionId() == null) {
            throw new IllegalArgumentException("Either userId or sessionId must be provided");
        }
        if (req.getShippingAddress() == null || req.getShippingAddress().isEmpty()) {
            throw new IllegalArgumentException("Shipping address is required");
        }

        String cartPk = cartPk(req.getUserId(), req.getSessionId());
        List<OrderTable> cartItems = orderTableRepository.findOrderItemsByPk(cartPk);

        // 2. Check for duplicate checkout from same cart
        Optional<OrderTable> existingMeta = orderTableRepository.findByCartId(cartPk).stream()
            .filter(o -> "META".equals(o.getSk()))
            .findFirst();
        if (existingMeta.isPresent()) {
            OrderTable meta = existingMeta.get();
            return CreateOrderResponse.builder()
                .orderId(meta.getOrderId())
                .orderPk(meta.getPk())
                .totalAmount(meta.getTotalAmount())
                .orderStatus(meta.getOrderStatus())
                .build();
        }

        // 3. Validate cart is not empty
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }

        // 4. Validate all products & variants exist (from ProductTable)
        for (OrderTable cartItem : cartItems) {
            if (cartItem.getProductId() == null) {
                throw new IllegalArgumentException("Cart item missing productId");
            }
            String productPk = DynamoDBKeyUtil.productPk(cartItem.getProductId());
            ProductTable product = productTableRepository.findProductByPk(productPk)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + cartItem.getProductId()));

            if (product.getIsActive() != null && !product.getIsActive()) {
                throw new IllegalArgumentException("Product is inactive: " + cartItem.getProductId());
            }

            // Validate variant if specified
            if (cartItem.getVariantId() != null && !cartItem.getVariantId().isEmpty()) {
                String variantSk = DynamoDBKeyUtil.productVariantSk(cartItem.getVariantId());
                productTableRepository.findVariantByPkAndSk(productPk, variantSk)
                    .orElseThrow(() -> new IllegalArgumentException("Variant not found: " + cartItem.getVariantId() 
                        + " for product " + cartItem.getProductId()));
            }
        }

        // 5. Validate warehouses exist
        List<WarehouseTable> warehouses = warehouseTableRepository.findByIsActiveTrue();
        if (warehouses.isEmpty()) {
            throw new IllegalStateException("No active warehouses available");
        }

        // 6. Pre-check: Verify sufficient stock across all warehouses for each product
        Map<String, Integer> inventoryMap = new HashMap<>();
        for (OrderTable cartItem : cartItems) {
            int qtyNeeded = cartItem.getQuantity() != null && cartItem.getQuantity() > 0 ? cartItem.getQuantity() : 0;
            if (qtyNeeded <= 0) {
                throw new IllegalArgumentException("Invalid quantity for product: " + cartItem.getProductId());
            }

            String inventoryKey = cartItem.getProductId() + "#" + (cartItem.getVariantId() != null ? cartItem.getVariantId() : "");
            int totalAvailable = 0;

            for (WarehouseTable warehouse : warehouses) {
                if (warehouse.getPk() == null) continue;

                // Check variant inventory first
                if (cartItem.getVariantId() != null && !cartItem.getVariantId().isEmpty()) {
                    String variantSk = DynamoDBKeyUtil.warehouseVariantSk(cartItem.getProductId(), cartItem.getVariantId());
                    Optional<WarehouseTable> variantInv = warehouseTableRepository.findVariantInventoryByPkAndSk(
                        warehouse.getPk(), variantSk);
                    if (variantInv.isPresent()) {
                        int available = variantInv.get().getAvailableQuantity() != null 
                            ? variantInv.get().getAvailableQuantity() 
                            : 0;
                        totalAvailable += available;
                        continue;
                    }
                }

                // Check product inventory
                String productSk = DynamoDBKeyUtil.warehouseProductSk(cartItem.getProductId());
                Optional<WarehouseTable> productInv = warehouseTableRepository.findProductInventoryByPkAndSk(
                    warehouse.getPk(), productSk);
                if (productInv.isPresent()) {
                    int available = productInv.get().getAvailableQuantity() != null 
                        ? productInv.get().getAvailableQuantity() 
                        : 0;
                    totalAvailable += available;
                }
            }

            if (totalAvailable < qtyNeeded) {
                throw new IllegalStateException("Insufficient stock for product " + cartItem.getProductId() 
                    + ". Required: " + qtyNeeded + ", Available: " + totalAvailable);
            }
            inventoryMap.put(inventoryKey, qtyNeeded);
        }

        // 7. Generate order ID and PK
        String orderId = UUID.randomUUID().toString();
        String orderPk = (req.getUserId() != null && !req.getUserId().isEmpty())
            ? DynamoDBKeyUtil.userOrderPk(req.getUserId(), orderId)
            : DynamoDBKeyUtil.orderPk(orderId);

        // 8. Calculate totals
        CartResponse totals = buildCartResponse(cartPk, req.getUserId(), req.getSessionId(), req.getCouponCode());

        // 9. Save Order META (OrderTable with SK=META)
        OrderTable orderMeta = OrderTable.builder()
            .pk(orderPk)
            .sk("META")
            .itemType("Order")
            .orderId(orderId)
            .userId(req.getUserId())
            .sessionId(req.getSessionId())
            .orderStatus("PENDING")
            .subtotal(totals.getSubtotal())
            .shippingAmount(totals.getShippingAmount())
            .discountAmount(totals.getDiscountAmount())
            .totalAmount(totals.getTotalAmount())
            .cartId(cartPk)
            .shippingAddress(req.getShippingAddress())
            .billingAddress(req.getBillingAddress() != null ? req.getBillingAddress() : req.getShippingAddress())
            .paymentMethod(req.getPaymentMethod())
            .paymentStatus("PENDING")
            .createdAt(System.currentTimeMillis())
            .build();
        orderTableRepository.save(orderMeta);

        // 10. Move cart items to order (OrderTable with SK=ITEM#...)
        for (OrderTable cartItem : cartItems) {
            String itemId = cartItem.getSk().substring(5); // Remove "ITEM#" prefix
            OrderTable orderItem = OrderTable.builder()
                .pk(orderPk)
                .sk("ITEM#" + itemId)
                .itemType("OrderItem")
                .productId(cartItem.getProductId())
                .variantId(cartItem.getVariantId())
                .productName(cartItem.getProductName())
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getUnitPrice())
                .itemTotal(cartItem.getItemTotal())
                .createdAt(System.currentTimeMillis())
                .build();
            orderTableRepository.save(orderItem);

            // 11. Allocate/reserve inventory from WarehouseTable
            int remaining = cartItem.getQuantity() != null ? cartItem.getQuantity() : 0;
            for (WarehouseTable warehouse : warehouses) {
                if (remaining <= 0) break;
                if (warehouse.getPk() == null) continue;

                // Try to reserve from variant inventory first
                if (cartItem.getVariantId() != null && !cartItem.getVariantId().isEmpty()) {
                    String variantSk = DynamoDBKeyUtil.warehouseVariantSk(cartItem.getProductId(), cartItem.getVariantId());
                    Optional<WarehouseTable> variantInv = warehouseTableRepository.findVariantInventoryByPkAndSk(
                        warehouse.getPk(), variantSk);
                    if (variantInv.isPresent()) {
                        WarehouseTable inv = variantInv.get();
                        int available = inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0;
                        if (available > 0) {
                            int reserve = Math.min(available, remaining);
                            inv.setAvailableQuantity(available - reserve);
                            inv.setReservedQuantity((inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0) + reserve);
                            inv.setUpdatedAt(System.currentTimeMillis());
                            warehouseTableRepository.save(inv);
                            remaining -= reserve;
                            continue;
                        }
                    }
                }

                // Try to reserve from product inventory
                String productSk = DynamoDBKeyUtil.warehouseProductSk(cartItem.getProductId());
                Optional<WarehouseTable> productInv = warehouseTableRepository.findProductInventoryByPkAndSk(
                    warehouse.getPk(), productSk);
                if (productInv.isPresent()) {
                    WarehouseTable inv = productInv.get();
                    int available = inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0;
                    if (available > 0) {
                        int reserve = Math.min(available, remaining);
                        inv.setAvailableQuantity(available - reserve);
                        inv.setReservedQuantity((inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0) + reserve);
                        inv.setUpdatedAt(System.currentTimeMillis());
                        warehouseTableRepository.save(inv);
                        remaining -= reserve;
                    }
                }
            }

            // Allocation failed
            if (remaining > 0) {
                throw new IllegalStateException("Failed to allocate stock for product " + cartItem.getProductId() 
                    + ". Could not reserve: " + remaining + " units");
            }

            // 12. Delete cart item
            orderTableRepository.deleteByPkAndSk(cartPk, cartItem.getSk());
        }

        // 13. Delete cart META
        orderTableRepository.deleteByPkAndSk(cartPk, "META");

        return CreateOrderResponse.builder()
            .orderId(orderId)
            .orderPk(orderPk)
            .totalAmount(totals.getTotalAmount())
            .orderStatus("PENDING")
            .build();
    }

    // Helper to build CartResponse and persist meta totals
    private final CouponService couponService; // thêm inject service

private CartResponse buildCartResponse(String pk, String userId, String sessionId, String couponCode) {
    List<OrderTable> items = orderTableRepository.findOrderItemsByPk(pk);
    List<CartItemResponse> itemResponses = items.stream().map(i -> CartItemResponse.builder()
        .itemId(i.getSk().replaceFirst("ITEM#", ""))
        .productId(i.getProductId())
        .variantId(i.getVariantId())
        .size(i.getSize())
        .quantity(i.getQuantity())
        .unitPrice(i.getUnitPrice())
        .itemTotal(i.getItemTotal())
        .build()).collect(Collectors.toList());

    double subtotal = itemResponses.stream().mapToDouble(it -> it.getItemTotal() != null ? it.getItemTotal() : 0.0).sum();

    double shipping = subtotal > 0 ? 10.0 : 0.0; // flat shipping
    double discount = 0.0;

    // Áp dụng coupon nếu có
    if (StringUtils.hasText(couponCode)) {
        try {
            ApplyCouponRequest applyReq = ApplyCouponRequest.builder()
                .couponCode(couponCode)
                .userId(userId)
                .orderId(UUID.randomUUID().toString()) // tạm orderId để tính discount
                .orderTotal(subtotal)
                .build();
            ApplyCouponResponse applyRes = couponService.applyCoupon(applyReq);
            discount = applyRes.getDiscountAmount();
        } catch (Exception e) {
            // Coupon không hợp lệ hoặc hết hạn → bỏ qua
            discount = 0.0;
        }
    }

    double total = subtotal + shipping - discount;

    // Lưu/update cart META
    OrderTable meta = OrderTable.builder()
        .pk(pk)
        .sk("META")
        .itemType("Cart")
        .userId(userId)
        .sessionId(sessionId)
        .subtotal(subtotal)
        .shippingAmount(shipping)
        .discountAmount(discount)
        .totalAmount(total)
        .updatedAt(System.currentTimeMillis())
        .build();
    orderTableRepository.save(meta);

    return CartResponse.builder()
        .cartId(pk)
        .userId(userId)
        .sessionId(sessionId)
        .items(itemResponses)
        .subtotal(subtotal)
        .shippingAmount(shipping)
        .discountAmount(discount)
        .totalAmount(total)
        .build();
}

}
