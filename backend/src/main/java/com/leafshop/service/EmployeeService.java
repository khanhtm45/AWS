package com.leafshop.service;

import com.leafshop.dto.employee.CreateEmployeeRequest;
import com.leafshop.dto.employee.EmployeeResponse;
import com.leafshop.dto.employee.UpdateEmployeeRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final UserTableRepository userTableRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeResponse createEmployee(CreateEmployeeRequest req) {
        String userId = UUID.randomUUID().toString();
        String pk = "USER#" + userId;
        long now = System.currentTimeMillis();

        UserTable meta = UserTable.builder()
            .pk(pk)
            .sk("META")
            .itemType("META")
            .firstName(req.getFirstName())
            .lastName(req.getLastName())
            .phoneNumber(req.getPhoneNumber())
            .email(req.getEmail())
            .createdAt(now)
            .updatedAt(now)
            .build();

        UserTable account = UserTable.builder()
            .pk(pk)
            .sk("ACCOUNT")
            .itemType("ACCOUNT")
            .username(req.getUsername())
            .email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .role(req.getRole() != null ? req.getRole() : "STAFF")
            .isActive(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        UserTable employee = UserTable.builder()
            .pk(pk)
            .sk("EMPLOYEE#" + UUID.randomUUID().toString())
            .itemType("EMPLOYEE")
            .employeeCode(req.getEmployeeCode())
            .department(req.getDepartment())
            .position(req.getPosition())
            .hireDate(req.getHireDate())
            .salary(req.getSalary())
            .createdAt(now)
            .updatedAt(now)
            .build();

        userTableRepository.save(meta);
        userTableRepository.save(account);
        userTableRepository.save(employee);

        EmployeeResponse resp = new EmployeeResponse();
        resp.setUserId(userId);
        resp.setUsername(account.getUsername());
        resp.setFirstName(meta.getFirstName());
        resp.setLastName(meta.getLastName());
        resp.setEmail(account.getEmail());
        resp.setPhoneNumber(meta.getPhoneNumber());
        resp.setRole(account.getRole());
        resp.setEmployeeCode(employee.getEmployeeCode());
        resp.setDepartment(employee.getDepartment());
        resp.setPosition(employee.getPosition());
        resp.setHireDate(employee.getHireDate());
        resp.setSalary(employee.getSalary());

        return resp;
    }

    public List<EmployeeResponse> listEmployees() {
        List<UserTable> empItems = userTableRepository.scanAllEmployees();
        return empItems.stream().map(e -> {
            var metaOpt = userTableRepository.findByPkAndSk(e.getPk(), "META");
            var accountOpt = userTableRepository.findAccountByPk(e.getPk());
            EmployeeResponse r = new EmployeeResponse();
            String userId = e.getPk().startsWith("USER#") ? e.getPk().substring(5) : e.getPk();
            r.setUserId(userId);
            accountOpt.ifPresent(a -> r.setUsername(a.getUsername()));
            metaOpt.ifPresent(m -> {
                r.setFirstName(m.getFirstName());
                r.setLastName(m.getLastName());
                r.setPhoneNumber(m.getPhoneNumber());
            });
            accountOpt.ifPresent(a -> { r.setEmail(a.getEmail()); r.setRole(a.getRole()); });
            r.setEmployeeCode(e.getEmployeeCode());
            r.setDepartment(e.getDepartment());
            r.setPosition(e.getPosition());
            r.setHireDate(e.getHireDate());
            r.setSalary(e.getSalary());
            return r;
        }).collect(Collectors.toList());
    }

    public EmployeeResponse getEmployee(String userId) {
        String pk = userId.startsWith("USER#") ? userId : "USER#" + userId;
        var empList = userTableRepository.findByPkAndSkStartingWith(pk, "EMPLOYEE#");
        if (empList.isEmpty()) throw new IllegalArgumentException("Employee not found");
        UserTable e = empList.get(0);
        var metaOpt = userTableRepository.findByPkAndSk(pk, "META");
        var accountOpt = userTableRepository.findAccountByPk(pk);

        EmployeeResponse r = new EmployeeResponse();
        r.setUserId(pk.substring(5));
        accountOpt.ifPresent(a -> r.setUsername(a.getUsername()));
        metaOpt.ifPresent(m -> { r.setFirstName(m.getFirstName()); r.setLastName(m.getLastName()); r.setPhoneNumber(m.getPhoneNumber()); });
        accountOpt.ifPresent(a -> { r.setEmail(a.getEmail()); r.setRole(a.getRole()); });
        r.setEmployeeCode(e.getEmployeeCode());
        r.setDepartment(e.getDepartment());
        r.setPosition(e.getPosition());
        r.setHireDate(e.getHireDate());
        r.setSalary(e.getSalary());
        return r;
    }

    public EmployeeResponse updateEmployee(String userId, UpdateEmployeeRequest req) {
        String pk = userId.startsWith("USER#") ? userId : "USER#" + userId;
        var metaOpt = userTableRepository.findByPkAndSk(pk, "META");
        var accountOpt = userTableRepository.findAccountByPk(pk);
        var empList = userTableRepository.findByPkAndSkStartingWith(pk, "EMPLOYEE#");
        if (metaOpt.isEmpty() || accountOpt.isEmpty() || empList.isEmpty()) throw new IllegalArgumentException("Employee not found");
        UserTable meta = metaOpt.get();
        UserTable account = accountOpt.get();
        UserTable emp = empList.get(0);

        if (req.getFirstName() != null) meta.setFirstName(req.getFirstName());
        if (req.getLastName() != null) meta.setLastName(req.getLastName());
        if (req.getPhoneNumber() != null) meta.setPhoneNumber(req.getPhoneNumber());
        if (req.getEmail() != null) account.setEmail(req.getEmail());
        if (req.getRole() != null) account.setRole(req.getRole());

        if (req.getEmployeeCode() != null) emp.setEmployeeCode(req.getEmployeeCode());
        if (req.getDepartment() != null) emp.setDepartment(req.getDepartment());
        if (req.getPosition() != null) emp.setPosition(req.getPosition());
        if (req.getHireDate() != null) emp.setHireDate(req.getHireDate());
        if (req.getSalary() != null) emp.setSalary(req.getSalary());

        long now = System.currentTimeMillis();
        meta.setUpdatedAt(now);
        account.setUpdatedAt(now);
        emp.setUpdatedAt(now);

        userTableRepository.save(meta);
        userTableRepository.save(account);
        userTableRepository.save(emp);

        return getEmployee(userId);
    }

    public void deleteEmployee(String userId) {
        String pk = userId.startsWith("USER#") ? userId : "USER#" + userId;
        // mark account as inactive
        var accountOpt = userTableRepository.findAccountByPk(pk);
        accountOpt.ifPresent(a -> { a.setIsActive(false); userTableRepository.save(a); });
    }
}
