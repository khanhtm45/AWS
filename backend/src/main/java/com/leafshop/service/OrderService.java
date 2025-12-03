package com.leafshop.service;

import com.leafshop.dto.order.*;
import com.leafshop.model.dynamodb.OrderTable;
import com.leafshop.model.dynamodb.WarehouseTable;
import com.leafshop.repository.OrderTableRepository;
import com.leafshop.repository.WarehouseTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderTableRepository orderTableRepository;
    private final WarehouseTableRepository warehouseTableRepository;
    private final CartService cartService;

    // -----------------------------
    // Helper: Convert ShippingAddress to Map
    // -----------------------------
    private Map<String, Object> shippingAddressToMap(ShippingAddress address) {
        if (address == null) return null;
        Map<String, Object> map = new HashMap<>();
        if (address.getFullName() != null) map.put("fullName", address.getFullName());
        if (address.getPhoneNumber() != null) map.put("phoneNumber", address.getPhoneNumber());
        if (address.getAddressLine1() != null) map.put("addressLine1", address.getAddressLine1());
        if (address.getAddressLine2() != null) map.put("addressLine2", address.getAddressLine2());
        if (address.getWard() != null) map.put("ward", address.getWard());
        if (address.getDistrict() != null) map.put("district", address.getDistrict());
        if (address.getCity() != null) map.put("city", address.getCity());
        if (address.getPostalCode() != null) map.put("postalCode", address.getPostalCode());
        if (address.getCountry() != null) map.put("country", address.getCountry());
        if (address.getNotes() != null) map.put("notes", address.getNotes());
        return map;
    }

    // -----------------------------
    // Helper: Convert Map to ShippingAddress
    // -----------------------------
    private ShippingAddress mapToShippingAddress(Map<String, String> map) {
        if (map == null || map.isEmpty()) return null;
        return ShippingAddress.builder()
                .fullName(map.get("fullName"))
                .phoneNumber(map.get("phoneNumber"))
                .addressLine1(map.get("addressLine1"))
                .addressLine2(map.get("addressLine2"))
                .ward(map.get("ward"))
                .district(map.get("district"))
                .city(map.get("city"))
                .postalCode(map.get("postalCode"))
                .country(map.get("country"))
                .notes(map.get("notes"))
                .build();
    }

    // -----------------------------
    // Create order from cart
    // -----------------------------
    public CreateOrderResponse createOrderFromCart(CreateOrderRequest req) {
        com.leafshop.dto.cart.CheckoutRequest checkoutReq = new com.leafshop.dto.cart.CheckoutRequest();
        checkoutReq.setUserId(req.getUserId());
        checkoutReq.setShippingAddress(req.getShippingAddress());
        checkoutReq.setPaymentMethod(req.getPaymentMethod());
        checkoutReq.setCouponCode(req.getCouponCode());

        CreateOrderResponse resp = cartService.checkout(checkoutReq);

        // Recalculate amounts (overload cho CreateOrderResponse)
        recalcOrderAmounts(resp);

        return resp;
    }

    // -----------------------------
    // Get all orders (for admin/staff)
    // -----------------------------
    public List<OrderResponse> getAllOrders() {
        // Get all order META records
        List<OrderTable> allOrdersMeta = orderTableRepository.scanAllOrdersMeta();
        List<OrderResponse> resp = new ArrayList<>();

        for (OrderTable m : allOrdersMeta) {
            // Skip CART records - only process real orders
            if (m.getPk() == null || m.getPk().startsWith("CART#") || m.getOrderId() == null) {
                continue;
            }
            
            // Get items for this order
            String pk = m.getPk();
            List<OrderTable> items = orderTableRepository.findOrderItemsByPk(pk);
            
            List<OrderItemResponse> itemResponses = items.stream()
                    .map(i -> OrderItemResponse.builder()
                            .itemId(i.getSk().replaceFirst("ITEM#", ""))
                            .productId(i.getProductId())
                            .variantId(i.getVariantId())
                            .productName(i.getProductName())
                            .quantity(i.getQuantity())
                            .unitPrice(i.getUnitPrice())
                            .itemTotal(i.getItemTotal())
                            .build())
                    .collect(Collectors.toList());

            OrderResponse order = OrderResponse.builder()
                    .orderId(m.getOrderId())
                    .orderPk(m.getPk())
                    .userId(m.getUserId())
                    .orderStatus(m.getOrderStatus())
                    .items(itemResponses)
                    .subtotal(m.getSubtotal())
                    .shippingAmount(m.getShippingAmount())
                    .discountAmount(m.getDiscountAmount())
                    .totalAmount(m.getTotalAmount())
                    .shippingAddress(mapToShippingAddress(m.getShippingAddress()))
                    .paymentMethod(m.getPaymentMethod())
                    .paymentStatus(m.getPaymentStatus())
                    .assignedTo(m.getAssignedTo())
                    .createdAt(m.getCreatedAt())
                    .updatedAt(m.getUpdatedAt())
                    .build();

            recalcOrderAmounts(order);
            resp.add(order);
        }
        
        // Sort by createdAt descending (newest first)
        resp.sort((a, b) -> {
            Long timeA = a.getCreatedAt() != null ? a.getCreatedAt() : 0L;
            Long timeB = b.getCreatedAt() != null ? b.getCreatedAt() : 0L;
            return timeB.compareTo(timeA);
        });
        
        return resp;
    }

    // -----------------------------
    // Get orders for a user
    // -----------------------------
    public List<OrderResponse> getOrdersForUser(String userId) {
        String prefix = "USER#" + userId + "#ORDER#";
        List<OrderTable> orders = orderTableRepository.findByPkStartingWith(prefix);
        Map<String, List<OrderTable>> grouped = orders.stream().collect(Collectors.groupingBy(OrderTable::getPk));
        List<OrderResponse> resp = new ArrayList<>();

        for (String pk : grouped.keySet()) {
            Optional<OrderTable> meta = grouped.get(pk).stream().filter(o -> "META".equals(o.getSk())).findFirst();
            List<OrderItemResponse> items = grouped.get(pk).stream().filter(o -> o.getSk().startsWith("ITEM#"))
                    .map(i -> OrderItemResponse.builder()
                            .itemId(i.getSk().replaceFirst("ITEM#", ""))
                            .productId(i.getProductId())
                            .variantId(i.getVariantId())
                            .productName(i.getProductName())
                            .quantity(i.getQuantity())
                            .unitPrice(i.getUnitPrice())
                            .itemTotal(i.getItemTotal())
                            .build())
                    .collect(Collectors.toList());

            if (meta.isPresent()) {
                OrderTable m = meta.get();
                OrderResponse order = OrderResponse.builder()
                        .orderId(m.getOrderId())
                        .orderPk(m.getPk())
                        .userId(m.getUserId())
                        .orderStatus(m.getOrderStatus())
                        .items(items)
                        .subtotal(m.getSubtotal())
                        .shippingAmount(m.getShippingAmount())
                        .discountAmount(m.getDiscountAmount())
                        .totalAmount(m.getTotalAmount())
                        .shippingAddress(mapToShippingAddress(m.getShippingAddress()))
                        .paymentMethod(m.getPaymentMethod())
                        .paymentStatus(m.getPaymentStatus())
                        .assignedTo(m.getAssignedTo())
                        .createdAt(m.getCreatedAt())
                        .updatedAt(m.getUpdatedAt())
                        .build();

                recalcOrderAmounts(order); // ensure totals are correct
                resp.add(order);
            }
        }
        return resp;
    }

    // -----------------------------
    // Get order details
    // -----------------------------
    public OrderResponse getOrderDetails(String orderId, String userId) {
        String pk = (userId != null && !userId.isEmpty()) ? "USER#" + userId + "#ORDER#" + orderId : "ORDER#" + orderId;
        Optional<OrderTable> metaOpt = orderTableRepository.findOrderMetaByPkAndSk(pk, "META");
        if (!metaOpt.isPresent()) return null;
        OrderTable meta = metaOpt.get();
        List<OrderTable> items = orderTableRepository.findOrderItemsByPk(pk);

        List<OrderItemResponse> itemResponses = items.stream()
                .map(i -> OrderItemResponse.builder()
                        .itemId(i.getSk().replaceFirst("ITEM#", ""))
                        .productId(i.getProductId())
                        .variantId(i.getVariantId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .itemTotal(i.getItemTotal())
                        .build())
                .collect(Collectors.toList());

        OrderResponse order = OrderResponse.builder()
                .orderId(meta.getOrderId())
                .orderPk(meta.getPk())
                .userId(meta.getUserId())
                .orderStatus(meta.getOrderStatus())
                .items(itemResponses)
                .subtotal(meta.getSubtotal())
                .shippingAmount(meta.getShippingAmount())
                .discountAmount(meta.getDiscountAmount())
                .totalAmount(meta.getTotalAmount())
                .shippingAddress(mapToShippingAddress(meta.getShippingAddress()))
                .paymentMethod(meta.getPaymentMethod())
                .paymentStatus(meta.getPaymentStatus())
                .assignedTo(meta.getAssignedTo())
                .build();

        recalcOrderAmounts(order);
        return order;
    }

    // -----------------------------
    // Update order status
    // -----------------------------
    public OrderResponse updateOrderStatus(String orderId, String userId, UpdateStatusRequest req) {
        String pk = (userId != null && !userId.isEmpty()) ? "USER#" + userId + "#ORDER#" + orderId : "ORDER#" + orderId;
        Optional<OrderTable> metaOpt = orderTableRepository.findOrderMetaByPkAndSk(pk, "META");
        if (!metaOpt.isPresent()) return null;
        OrderTable meta = metaOpt.get();
        meta.setOrderStatus(req.getStatus());
        if (req.getNote() != null) meta.setNotes(req.getNote());
        meta.setUpdatedAt(System.currentTimeMillis());
        orderTableRepository.save(meta);
        return getOrderDetails(orderId, userId);
    }

    // -----------------------------
    // Update payment status
    // -----------------------------
    public OrderResponse updatePaymentStatus(String orderId, String userId, PaymentUpdateRequest req) {
        String pk = (userId != null && !userId.isEmpty()) ? "USER#" + userId + "#ORDER#" + orderId : "ORDER#" + orderId;
        Optional<OrderTable> metaOpt = orderTableRepository.findOrderMetaByPkAndSk(pk, "META");
        if (!metaOpt.isPresent()) return null;
        OrderTable meta = metaOpt.get();
        meta.setPaymentStatus(req.getPaymentStatus());
        meta.setTransactionId(req.getTransactionId());
        meta.setPaymentAmount(req.getPaymentAmount());
        meta.setUpdatedAt(System.currentTimeMillis());
        orderTableRepository.save(meta);
        return getOrderDetails(orderId, userId);
    }

    // -----------------------------
    // Process return
    // -----------------------------
    public OrderResponse processReturn(String orderId, String userId, ReturnRequest req) {
        String pk = (userId != null && !userId.isEmpty()) ? "USER#" + userId + "#ORDER#" + orderId : "ORDER#" + orderId;
        Optional<OrderTable> metaOpt = orderTableRepository.findOrderMetaByPkAndSk(pk, "META");
        if (!metaOpt.isPresent()) return null;
        OrderTable meta = metaOpt.get();

        meta.setOrderStatus("RETURNED");
        if (req.getRefundAmount() != null) {
            double newTotal = (meta.getTotalAmount() != null ? meta.getTotalAmount() : 0.0) - req.getRefundAmount();
            meta.setTotalAmount(newTotal);
            meta.setAppliedDiscountAmount((meta.getAppliedDiscountAmount() != null ? meta.getAppliedDiscountAmount() : 0.0));
        }
        meta.setUpdatedAt(System.currentTimeMillis());
        orderTableRepository.save(meta);

        // Restock items if requested
        if (Boolean.TRUE.equals(req.getRestock()) && req.getItems() != null) {
            List<WarehouseTable> warehouses = warehouseTableRepository.findAll();
            for (ReturnItem r : req.getItems()) {
                int qtyToAdd = r.getQuantity() != null ? r.getQuantity() : 0;
                if (qtyToAdd <= 0) continue;
                for (WarehouseTable whMeta : warehouses) {
                    String whPk = whMeta.getPk();
                    String variantSk = "PRODUCT#" + r.getProductId() + "#VARIANT#" + r.getVariantId();
                    Optional<WarehouseTable> invOpt = warehouseTableRepository.findVariantInventoryByPkAndSk(whPk, variantSk);
                    if (invOpt.isPresent()) {
                        WarehouseTable inv = invOpt.get();
                        inv.setQuantity((inv.getQuantity() != null ? inv.getQuantity() : 0) + qtyToAdd);
                        inv.setAvailableQuantity((inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0) + qtyToAdd);
                        inv.setUpdatedAt(System.currentTimeMillis());
                        warehouseTableRepository.save(inv);
                        break;
                    }
                    String productSk = "PRODUCT#" + r.getProductId();
                    Optional<WarehouseTable> pinvOpt = warehouseTableRepository.findProductInventoryByPkAndSk(whPk, productSk);
                    if (pinvOpt.isPresent()) {
                        WarehouseTable pinv = pinvOpt.get();
                        pinv.setQuantity((pinv.getQuantity() != null ? pinv.getQuantity() : 0) + qtyToAdd);
                        pinv.setAvailableQuantity((pinv.getAvailableQuantity() != null ? pinv.getAvailableQuantity() : 0) + qtyToAdd);
                        pinv.setUpdatedAt(System.currentTimeMillis());
                        warehouseTableRepository.save(pinv);
                        break;
                    }
                }
            }
        }

        return getOrderDetails(orderId, userId);
    }

    // -----------------------------
    // Assign order
    // -----------------------------
    public OrderResponse assignOrder(String orderId, String userId, AssignRequest req) {
        String pk = (userId != null && !userId.isEmpty()) ? "USER#" + userId + "#ORDER#" + orderId : "ORDER#" + orderId;
        Optional<OrderTable> metaOpt = orderTableRepository.findOrderMetaByPkAndSk(pk, "META");
        if (!metaOpt.isPresent()) return null;
        OrderTable meta = metaOpt.get();
        meta.setAssignedTo(req.getStaffId());
        meta.setUpdatedAt(System.currentTimeMillis());
        orderTableRepository.save(meta);
        return getOrderDetails(orderId, userId);
    }

    // -----------------------------
    // Recalculate order amounts for OrderResponse
    // -----------------------------
    private void recalcOrderAmounts(OrderResponse order) {
        if (order.getItems() != null) {
            double subtotal = order.getItems().stream()
                    .mapToDouble(i -> i.getItemTotal() != null ? i.getItemTotal() : 0.0)
                    .sum();
            order.setSubtotal(subtotal);
            double shipping = order.getShippingAmount() != null ? order.getShippingAmount() : 0.0;
            double discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0;
            order.setTotalAmount(subtotal + shipping - discount);
        }
    }

    // -----------------------------
    // Recalculate order amounts for CreateOrderResponse
    // -----------------------------
    private void recalcOrderAmounts(CreateOrderResponse order) {
        if (order.getTotalAmount() == null) {
            order.setTotalAmount(0.0);
        }
    }
}
