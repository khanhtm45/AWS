package com.leafshop.dto.order;

import lombok.Data;

import java.util.List;

@Data
public class ReturnRequest {
    private List<ReturnItem> items;
    private Double refundAmount;
    private Boolean restock;
}
