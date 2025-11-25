package com.leafshop.dto.employee;

import lombok.Data;

@Data
public class EmployeeResponse {
    private String userId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String role;
    private String employeeCode;
    private String department;
    private String position;
    private Long hireDate;
    private Double salary;
}
