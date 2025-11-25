package com.leafshop.dto.staff;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {
    private String userId;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private Long registrationDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private String formattedDate;
    
    private Integer totalOrders;
    private Double totalSpent;
    private String status; // "active", "inactive", "banned"
    
    // Method to format timestamp
    public static String formatDate(Long timestamp) {
        if (timestamp == null) return null;
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
