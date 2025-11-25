package com.leafshop.dto.employee;

import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class CreateEmployeeRequest {
    @NotBlank
    private String firstName;

    private String lastName;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @Email
    private String email;

    private String phoneNumber;

    private String role; // ADMIN, STAFF, MANAGER

    private String employeeCode;
    private String department;
    private String position;
    private Long hireDate;
    private Double salary;
}
