package com.leafshop.controller;

import com.leafshop.dto.cart.*;
import com.leafshop.dto.order.CreateOrderResponse;
import com.leafshop.dto.order.CreateOrderRequest;
import com.leafshop.service.OrderService;
import com.leafshop.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<CartResponse> createOrGetCart(@RequestBody CartRequest req) {
        return ResponseEntity.ok(cartService.getOrCreateCart(req.getUserId(), req.getSessionId()));
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@RequestParam(required = false) String userId,
                                                @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(cartService.getCart(userId, sessionId));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(@RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.addItem(req));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateItem(@PathVariable String itemId,
                                                   @RequestParam(required = false) String userId,
                                                   @RequestParam(required = false) String sessionId,
                                                   @RequestParam Integer quantity) {
        return ResponseEntity.ok(cartService.updateItem(userId, sessionId, itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> deleteItem(@PathVariable String itemId,
                                                   @RequestParam(required = false) String userId,
                                                   @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(cartService.deleteItem(userId, sessionId, itemId));
    }

    @GetMapping("/total")
    public ResponseEntity<CartResponse> total(@RequestParam(required = false) String userId,
                                              @RequestParam(required = false) String sessionId,
                                              @RequestParam(required = false) String couponCode) {
        return ResponseEntity.ok(cartService.computeTotals(userId, sessionId, couponCode));
    }

    @PostMapping("/checkout")
    public ResponseEntity<CreateOrderResponse> checkout(@RequestBody CheckoutRequest req) {
        return ResponseEntity.ok(cartService.checkout(req));
    }

    @PostMapping("/check")
    public ResponseEntity<CreateOrderResponse> check(@RequestBody CreateOrderRequest req) {
        CreateOrderResponse resp = orderService.createOrderFromCart(req);
        return ResponseEntity.ok(resp);
    }
}
