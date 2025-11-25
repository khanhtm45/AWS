package com.leafshop.dto.staff;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPurchaseHistoryResponse {
    private String userId;
    private String customerName;
    private List<OrderSummary> orders;
    private Double totalSpent;
    private Integer totalOrderCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderSummary {
        private String orderId;
        private Long orderDate;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
        private String formattedOrderDate;
        
        private Double totalAmount;
        private String status;
        private Integer itemCount;
        
        // Method to format timestamp
        public static String formatDate(Long timestamp) {
            if (timestamp == null) return null;
            return Instant.ofEpochMilli(timestamp)
                    .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
    }
}
