package com.leafshop.dto.dashboard;

import lombok.Data;

import java.util.Map;

@Data
public class DashboardStatsDTO {
    private KPIData kpiData;
    private Map<String, Object> revenueData;
    private Map<String, Object> ordersData;

    @Data
    public static class KPIData {
        private OrderStats totalOrders;
        private RevenueStats revenue;
        private ProductStats productsSold;
        private CustomerStats newCustomers;
        private Integer lowStock;

        @Data
        public static class OrderStats {
            private Long today;
            private Long week;
            private Long month;
        }

        @Data
        public static class RevenueStats {
            private Double today;
            private Double month;
        }

        @Data
        public static class ProductStats {
            private Long today;
            private Long month;
        }

        @Data
        public static class CustomerStats {
            private Long today;
            private Long month;
        }
    }
}
