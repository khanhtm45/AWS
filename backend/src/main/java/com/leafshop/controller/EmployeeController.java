package com.leafshop.controller;

import com.leafshop.dto.employee.CreateEmployeeRequest;
import com.leafshop.dto.employee.EmployeeResponse;
import com.leafshop.dto.employee.UpdateEmployeeRequest;
import com.leafshop.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest req) {
        return ResponseEntity.ok(employeeService.createEmployee(req));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> list() {
        return ResponseEntity.ok(employeeService.listEmployees());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<EmployeeResponse> get(@PathVariable String userId) {
        return ResponseEntity.ok(employeeService.getEmployee(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<EmployeeResponse> update(@PathVariable String userId, @Valid @RequestBody UpdateEmployeeRequest req) {
        return ResponseEntity.ok(employeeService.updateEmployee(userId, req));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> delete(@PathVariable String userId) {
        employeeService.deleteEmployee(userId);
        return ResponseEntity.ok().build();
    }
}
