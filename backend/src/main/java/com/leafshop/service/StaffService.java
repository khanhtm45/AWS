package com.leafshop.service;

import com.leafshop.dto.staff.CustomerResponse;
import com.leafshop.dto.order.OrderItemResponse;
import com.leafshop.dto.order.OrderResponse;
import com.leafshop.dto.staff.CustomerPurchaseHistoryResponse;
import com.leafshop.model.dynamodb.OrderTable;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.OrderTableRepository;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserTableRepository userRepository;
    private final OrderTableRepository orderRepository;

    // Get list of all customers
    public List<CustomerResponse> getAllCustomers() {
        // Scan all users with META records
        List<UserTable> users = userRepository.scanAllUsersMeta();
        
        return users.stream()
                .map(user -> {
                    // Extract userId from PK (format: USER#<user_id>)
                    String userId = user.getPk() != null ? user.getPk().replace("USER#", "") : "";
                    
                    // Get orders for this user
                    String orderPkPrefix = "USER#" + userId + "#ORDER#";
                    List<OrderTable> orders = orderRepository.findByPkStartingWith(orderPkPrefix);
                    
                    // Filter only META orders
                    List<OrderTable> metaOrders = orders.stream()
                            .filter(order -> order.getSk() != null && order.getSk().equals("META"))
                            .collect(Collectors.toList());
                    
                    // Calculate total spent
                    double totalSpent = metaOrders.stream()
                            .filter(order -> order.getTotalAmount() != null)
                            .mapToDouble(OrderTable::getTotalAmount)
                            .sum();
                    
                    // Build response
                    return CustomerResponse.builder()
                            .userId(userId)
                            .email(user.getEmail())
                            .phone(null)
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .registrationDate(user.getCreatedAt())
                            .formattedDate(CustomerResponse.formatDate(user.getCreatedAt()))
                            .totalOrders(metaOrders.size())
                            .totalSpent(totalSpent)
                            .status(user.getIsActive() != null && user.getIsActive() ? "active" : "inactive")
                            .build();
                })
                .collect(Collectors.toList());
    }

    // Get purchase history for a specific customer
    public CustomerPurchaseHistoryResponse getCustomerPurchaseHistory(String userId) {
        String userPk = "USER#" + userId;
        
        // Get user info from META
        UserTable user = userRepository.findByPkAndSk(userPk, "META")
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // Get all orders for this user
        String orderPkPrefix = "USER#" + userId + "#ORDER#";
        List<OrderTable> orders = orderRepository.findByPkStartingWith(orderPkPrefix);
        
        List<CustomerPurchaseHistoryResponse.OrderSummary> orderSummaries = orders.stream()
                .filter(order -> order.getSk() != null && order.getSk().equals("META"))
                .sorted((o1, o2) -> Long.compare(o2.getCreatedAt(), o1.getCreatedAt()))
                .map(order -> CustomerPurchaseHistoryResponse.OrderSummary.builder()
                        .orderId(order.getOrderId())
                        .orderDate(order.getCreatedAt())
                        .formattedOrderDate(CustomerPurchaseHistoryResponse.OrderSummary.formatDate(order.getCreatedAt()))
                        .totalAmount(order.getTotalAmount())
                        .status(order.getOrderStatus())
                        .itemCount(0)
                        .build())
                .collect(Collectors.toList());

        double totalSpent = orders.stream()
                .filter(order -> order.getTotalAmount() != null)
                .mapToDouble(OrderTable::getTotalAmount)
                .sum();

        String customerName = (user.getFirstName() != null ? user.getFirstName() : "") + " " +
                              (user.getLastName() != null ? user.getLastName() : "");

        return CustomerPurchaseHistoryResponse.builder()
                .userId(userId)
                .customerName(customerName.trim())
                .orders(orderSummaries)
                .totalSpent(totalSpent)
                .totalOrderCount(orderSummaries.size())
                .build();
    }
     public List<OrderResponse> getAllOrders() {
    List<OrderTable> orders = orderRepository.scanAllOrdersMeta();

    return orders.stream()
            // Lọc bỏ CART
            .filter(order -> order.getPk() != null && !order.getPk().startsWith("CART#"))
            .map(order -> OrderResponse.builder()
                    .orderId(order.getOrderId())
                    .orderPk(order.getPk())
                    .userId(order.getUserId())
                    .orderStatus(order.getOrderStatus())
                    .subtotal(order.getSubtotal() != null ? order.getSubtotal() : 0)
                    .shippingAmount(order.getShippingAmount() != null ? order.getShippingAmount() : 0)
                    .discountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : 0)
                    .totalAmount(order.getTotalAmount() != null ? order.getTotalAmount() : 0)
                    .shippingAddress(order.getShippingAddress())
                    .paymentMethod(order.getPaymentMethod())
                    .paymentStatus(order.getPaymentStatus())
                    .assignedTo(order.getAssignedTo())
                    .items(orderRepository.findOrderItemsByPk(order.getPk()).stream()
                            .map(item -> OrderItemResponse.builder()
                                    .itemId(item.getSk())
                                    .productId(item.getProductId())
                                    .variantId(item.getVariantId())
                                    .productName(item.getProductName())
                                    .quantity(item.getQuantity())
                                    .unitPrice(item.getUnitPrice())
                                    .itemTotal(item.getItemTotal())
                                    .build())
                            .collect(Collectors.toList()))
                    .build())
            .collect(Collectors.toList());
}
}

