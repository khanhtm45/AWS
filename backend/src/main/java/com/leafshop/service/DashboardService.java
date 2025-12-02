package com.leafshop.service;

import com.leafshop.dto.dashboard.DashboardStatsDTO;
import com.leafshop.model.dynamodb.OrderTable;
import com.leafshop.model.dynamodb.WarehouseTable;
import com.leafshop.repository.OrderTableRepository;
import com.leafshop.repository.ProductTableRepository;
import com.leafshop.repository.WarehouseTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderTableRepository orderTableRepository;
    private final ProductTableRepository productTableRepository;
    private final WarehouseTableRepository warehouseTableRepository;

    public DashboardStatsDTO getDashboardStats(String period) {
        long now = Instant.now().toEpochMilli();

        // compute start of day/week/month in epoch millis (UTC)
        ZonedDateTime znow = ZonedDateTime.now(ZoneOffset.UTC);
        long startOfDay = znow.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
        long startOfWeek = znow.minusDays(7).toInstant().toEpochMilli();
        long startOfMonth = znow.withDayOfMonth(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();

        DashboardStatsDTO stats = new DashboardStatsDTO();
        DashboardStatsDTO.KPIData kpi = new DashboardStatsDTO.KPIData();

        List<OrderTable> ordersMeta = orderTableRepository.scanAllOrdersMeta();

        // Orders counts
        DashboardStatsDTO.KPIData.OrderStats orderStats = new DashboardStatsDTO.KPIData.OrderStats();
        long todayCount = ordersMeta.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfDay && o.getCreatedAt() <= now).count();
        long weekCount = ordersMeta.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfWeek && o.getCreatedAt() <= now).count();
        long monthCount = ordersMeta.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfMonth && o.getCreatedAt() <= now).count();
        orderStats.setToday(todayCount);
        orderStats.setWeek(weekCount);
        orderStats.setMonth(monthCount);
        kpi.setTotalOrders(orderStats);

        // Revenue
        DashboardStatsDTO.KPIData.RevenueStats revenueStats = new DashboardStatsDTO.KPIData.RevenueStats();
        double todayRevenue = ordersMeta.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfDay && o.getCreatedAt() <= now)
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();
        double monthRevenue = ordersMeta.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfMonth && o.getCreatedAt() <= now)
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();
        revenueStats.setToday(todayRevenue);
        revenueStats.setMonth(monthRevenue);
        kpi.setRevenue(revenueStats);

        // Products sold (approx) - sum quantities from order items per order
        DashboardStatsDTO.KPIData.ProductStats productStats = new DashboardStatsDTO.KPIData.ProductStats();
        long productsSoldToday = ordersMeta.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfDay && o.getCreatedAt() <= now)
                .mapToLong(o -> orderTableRepository.findOrderItemsByPk(o.getPk()).stream()
                        .mapToLong(it -> it.getQuantity() != null ? it.getQuantity() : 0).sum())
                .sum();
        long productsSoldMonth = ordersMeta.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt() >= startOfMonth && o.getCreatedAt() <= now)
                .mapToLong(o -> orderTableRepository.findOrderItemsByPk(o.getPk()).stream()
                        .mapToLong(it -> it.getQuantity() != null ? it.getQuantity() : 0).sum())
                .sum();
        productStats.setToday(productsSoldToday);
        productStats.setMonth(productsSoldMonth);
        kpi.setProductsSold(productStats);

        // Low stock across warehouses
        int lowStockCount = 0;
        List<com.leafshop.model.dynamodb.WarehouseTable> warehouses = warehouseTableRepository.findAll();
        for (WarehouseTable wh : warehouses) {
            List<WarehouseTable> inv = warehouseTableRepository.findInventoryByPk(wh.getPk());
            for (WarehouseTable item : inv) {
                Integer avail = item.getAvailableQuantity();
                Integer reorder = item.getReorderPoint();
                if (avail != null && reorder != null && avail <= reorder) {
                    lowStockCount++;
                }
            }
        }
        kpi.setLowStock(lowStockCount);

        stats.setKpiData(kpi);
        return stats;
    }
}
