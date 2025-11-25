package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

/**
 * UserTable - Quản lý người dùng, tài khoản, token, địa chỉ và thông tin nhân viên
 * PK: USER#<user_id>
 * SK: META | ACCOUNT | TOKEN#<token_id> | ADDRESS#<address_id> | EMPLOYEE#<employee_id>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class UserTable {

    private String pk; // USER#<user_id>

    private String sk; // META | ACCOUNT | TOKEN#<token_id> | ADDRESS#<address_id> | EMPLOYEE#<employee_id>

    @DynamoDbAttribute("PK")
    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbAttribute("SK")
    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }

    private String itemType;

    // META fields
    private String firstName;

    private String lastName;

    private String phoneNumber;

    private String nationalId; // CCCD

    // ACCOUNT fields
    private String username;

    private String email;

    private String password;

    private String role; // USER, ADMIN, STAFF, MANAGER

    private Boolean isActive;

    // TOKEN fields
    private String tokenValue;

    private String tokenType; // JWT, OTP, REFRESH_TOKEN

    private Long expiresAt;

    // ADDRESS fields
    private String addressLine1;

    private String addressLine2;

    private String city;

    private String province;

    private String postalCode;

    private String country;

    private Boolean isDefault;

    // EMPLOYEE fields
    private String employeeCode;

    private String department;

    private String position;

    private Long hireDate;

    private Double salary;

    // Common fields
    private Long createdAt;

    private Long updatedAt;
}

