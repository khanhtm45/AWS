package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class Role {

    // Partition key: ROLE#<role_id>
    private String pk;

    // Sort key required by table schema
    private String sk;

    private String roleId; // role_id (UUID or short id)

    private String roleName;

    @DynamoDbAttribute("PK")
    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbAttribute("SK")
    public String getSk() {
        return sk;
    }

    @DynamoDbAttribute("roleId")
    public String getRoleId() {
        return roleId;
    }

    @DynamoDbAttribute("roleName")
    public String getRoleName() {
        return roleName;
    }
}
