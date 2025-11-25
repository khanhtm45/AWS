package com.leafshop.controller;

import com.leafshop.dto.order.*;
import com.leafshop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // Create a new order from cart
    @PostMapping
    public ResponseEntity<CreateOrderResponse> createOrder(@RequestBody CreateOrderRequest req) {
        CreateOrderResponse resp = orderService.createOrderFromCart(req);
        return ResponseEntity.ok(resp);
    }

    // (Removed) Use POST /api/orders to create orders from cart

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(@RequestParam String userId) {
        return ResponseEntity.ok(orderService.getOrdersForUser(userId));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String orderId,
                                                  @RequestParam(required = false) String userId) {
        OrderResponse resp = orderService.getOrderDetails(orderId, userId);
        if (resp == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable String orderId,
                                                      @RequestParam(required = false) String userId,
                                                      @RequestBody UpdateStatusRequest req) {
        OrderResponse resp = orderService.updateOrderStatus(orderId, userId, req);
        if (resp == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{orderId}/payment")
    public ResponseEntity<OrderResponse> updatePayment(@PathVariable String orderId,
                                                       @RequestParam(required = false) String userId,
                                                       @RequestBody PaymentUpdateRequest req) {
        OrderResponse resp = orderService.updatePaymentStatus(orderId, userId, req);
        if (resp == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{orderId}/return")
    public ResponseEntity<OrderResponse> processReturn(@PathVariable String orderId,
                                                       @RequestParam(required = false) String userId,
                                                       @RequestBody ReturnRequest req) {
        OrderResponse resp = orderService.processReturn(orderId, userId, req);
        if (resp == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{orderId}/assign")
    public ResponseEntity<OrderResponse> assignOrder(@PathVariable String orderId,
                                                     @RequestParam(required = false) String userId,
                                                     @RequestBody AssignRequest req) {
        OrderResponse resp = orderService.assignOrder(orderId, userId, req);
        if (resp == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resp);
    }
}

