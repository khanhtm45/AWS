package com.leafshop.dto.order;

import lombok.Data;

@Data
public class UpdateStatusRequest {
    private String status;
    private String note;
}
