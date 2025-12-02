package com.leafshop.model.dynamodb;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class SizeTable {
    
    private String sizeId;
    private String sizeName;
    private Integer sizeOrder;
    private Boolean isActive;
    
    @DynamoDbPartitionKey
    @DynamoDbAttribute("sizeId")
    public String getSizeId() {
        return sizeId;
    }
    
    public void setSizeId(String sizeId) {
        this.sizeId = sizeId;
    }
    
    @DynamoDbAttribute("sizeName")
    public String getSizeName() {
        return sizeName;
    }
    
    public void setSizeName(String sizeName) {
        this.sizeName = sizeName;
    }
    
    @DynamoDbAttribute("sizeOrder")
    public Integer getSizeOrder() {
        return sizeOrder;
    }
    
    public void setSizeOrder(Integer sizeOrder) {
        this.sizeOrder = sizeOrder;
    }
    
    @DynamoDbAttribute("isActive")
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}