package com.leafshop.dto.size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SizeTableResponse {
    private String sizeId;
    private String sizeName;
    private Integer sizeOrder;
    private Boolean isActive;
}