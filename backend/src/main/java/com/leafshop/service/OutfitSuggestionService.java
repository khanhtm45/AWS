package com.leafshop.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OutfitSuggestionService {

    /**
     * Return mock product suggestions. In production this should query the product DB
     * and run ranking logic. For local testing we return deterministic mock data.
     */
    public Map<String, Object> getMockSuggestions(Map<String, String> params) {
        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (int i = 1; i <= 6; i++) {
            Map<String, Object> p = new HashMap<>();
            p.put("id", "prod-" + i);
            p.put("name", "Product " + i + " — Áo/Quần mẫu");
            p.put("price", String.format("%d.000₫", 199 + i * 50));
            p.put("image", "https://via.placeholder.com/320x320.png?text=Prod+" + i);
            p.put("url", "#/product/" + i);
            p.put("category", i % 2 == 0 ? "Áo" : "Quần");
            suggestions.add(p);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("type", "suggestions");
        resp.put("text", "Mình gợi ý một vài set đồ theo mô tả của bạn:");
        resp.put("suggestions", suggestions);
        return resp;
    }
}
