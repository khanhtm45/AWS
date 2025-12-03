package com.leafshop.service;

import com.leafshop.dto.staff.CustomerResponse;
import com.leafshop.dto.order.OrderItemResponse;
import com.leafshop.dto.order.OrderResponse;
import com.leafshop.dto.order.ShippingAddress;
import com.leafshop.dto.staff.CustomerPurchaseHistoryResponse;
import com.leafshop.model.dynamodb.OrderTable;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.OrderTableRepository;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserTableRepository userRepository;
    private final OrderTableRepository orderRepository;

    // Helper: Convert Map to ShippingAddress
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

    // Get list of all customers
    public List<CustomerResponse> getAllCustomers() {
        try {
            // Scan all users with META records
            List<UserTable> metaUsers = userRepository.scanAllUsersMeta();
            System.out.println("📊 [getAllCustomers] Found " + metaUsers.size() + " META users");
            
            // For each user, get ACCOUNT record to check role
            List<CustomerResponse> customerResponses = new java.util.ArrayList<>();
            
            for (UserTable metaUser : metaUsers) {
                try {
                    // Extract userId from PK (format: USER#<user_id>)
                    String userPk = metaUser.getPk();
                    String userId = userPk != null ? userPk.replace("USER#", "") : "";
                    
                    // Get ACCOUNT record to check role
                    UserTable accountRecord = userRepository.findByPkAndSk(userPk, "ACCOUNT")
                            .orElse(null);
                    
                    if (accountRecord == null) {
                        System.out.println("⚠️ [getAllCustomers] No ACCOUNT record found for user: " + userId);
                        continue;
                    }
                    
                    String role = accountRecord.getRole();
                    String roleId = accountRecord.getRoleId();
                    System.out.println("👤 [getAllCustomers] User: " + accountRecord.getEmail() + ", role: " + role + ", roleId: " + roleId);
                    
                    // Filter only customers
                    boolean isCustomer = (role != null && role.equalsIgnoreCase("customer")) ||
                                       (roleId != null && roleId.equalsIgnoreCase("CUSTOMER"));
                    
                    if (!isCustomer) {
                        System.out.println("⏭️ [getAllCustomers] Skipping non-customer user: " + userId);
                        continue;
                    }
                    
                    System.out.println("✅ [getAllCustomers] Processing customer: " + userId);
                    
                    // Get orders for this user using email (orders are keyed by email, not UUID)
                    String userEmail = accountRecord.getEmail();
                    String orderPkPrefix = "USER#" + userEmail + "#ORDER#";
                    System.out.println("🔍 [getAllCustomers] Searching orders with prefix: " + orderPkPrefix);
                    List<OrderTable> orders = orderRepository.findByPkStartingWith(orderPkPrefix);
                    System.out.println("📦 [getAllCustomers] Found " + orders.size() + " order records for user: " + userEmail);
                    
                    // Filter only META orders
                    List<OrderTable> metaOrders = orders.stream()
                            .filter(order -> order.getSk() != null && order.getSk().equals("META"))
                            .collect(Collectors.toList());
                    System.out.println("✅ [getAllCustomers] Found " + metaOrders.size() + " META orders for user: " + userId);
                    
                    // Calculate total spent
                    double totalSpent = metaOrders.stream()
                            .filter(order -> order.getTotalAmount() != null)
                            .mapToDouble(OrderTable::getTotalAmount)
                            .sum();
                    System.out.println("💰 [getAllCustomers] Total spent for user " + userId + ": " + totalSpent);
                    
                    // Build response
                    CustomerResponse response = CustomerResponse.builder()
                            .userId(userId)
                            .email(accountRecord.getEmail())
                            .phone(metaUser.getPhoneNumber())
                            .firstName(metaUser.getFirstName())
                            .lastName(metaUser.getLastName())
                            .registrationDate(metaUser.getCreatedAt())
                            .formattedDate(CustomerResponse.formatDate(metaUser.getCreatedAt()))
                            .totalOrders(metaOrders.size())
                            .totalSpent(totalSpent)
                            .status(accountRecord.getIsActive() != null && accountRecord.getIsActive() ? "active" : "inactive")
                            .build();
                    
                    customerResponses.add(response);
                    
                } catch (Exception e) {
                    // Log error but continue processing other users
                    System.err.println("❌ [getAllCustomers] Error processing user: " + metaUser.getPk() + " - " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            System.out.println("✅ [getAllCustomers] Total customers returned: " + customerResponses.size());
            return customerResponses;
        } catch (Exception e) {
            System.err.println("Error in getAllCustomers: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get customers", e);
        }
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
                    .shippingAddress(mapToShippingAddress(order.getShippingAddress()))
                    .paymentMethod(order.getPaymentMethod())
                    .paymentStatus(order.getPaymentStatus())
                    .assignedTo(order.getAssignedTo())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
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

