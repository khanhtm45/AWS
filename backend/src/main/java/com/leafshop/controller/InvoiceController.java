package com.leafshop.controller;

import com.leafshop.dto.order.OrderResponse;
import com.leafshop.service.InvoiceService;
import com.leafshop.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/invoice")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private OrderService orderService;

    /**
     * Generate and download invoice as PDF
     */
    @GetMapping("/{orderId}/pdf")
    public ResponseEntity<Resource> downloadInvoicePDF(@PathVariable String orderId,
            @RequestParam(required = false) String userId) {
        try {
            // Get order details
            OrderResponse order = orderService.getOrderDetails(orderId, userId);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }

            // Generate PDF
            byte[] pdfBytes = invoiceService.generateInvoicePDF(order);

            ByteArrayResource resource = new ByteArrayResource(pdfBytes);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=HoaDon_" + orderId + ".pdf");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(pdfBytes.length)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send invoice via email
     */
    @PostMapping("/{orderId}/email")
    public ResponseEntity<?> sendInvoiceEmail(@PathVariable String orderId,
            @RequestParam(required = false) String userId,
            @RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            // Get order details
            OrderResponse order = orderService.getOrderDetails(orderId, userId);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }

            // Send email with invoice
            boolean sent = invoiceService.sendInvoiceEmail(order, email);

            if (sent) {
                return ResponseEntity.ok(Map.of("message", "Invoice sent successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to send invoice"));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
