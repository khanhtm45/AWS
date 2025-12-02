package com.leafshop.controller;

import com.leafshop.dto.dashboard.DashboardStatsDTO;
import com.leafshop.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardStatsDTO getStats(@RequestParam(defaultValue = "today") String period) {
        return dashboardService.getDashboardStats(period);
    }
}
