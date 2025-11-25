package com.leafshop.bootstrap;

import com.leafshop.model.dynamodb.Role;
import com.leafshop.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Order(100)
@RequiredArgsConstructor
public class RoleSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        List<String> roles = Arrays.asList("Customer", "Employee", "Admin", "Staff", "Manager");
        for (String rn : roles) {
            var opt = roleRepository.findByRoleName(rn);
            if (opt.isEmpty()) {
                String id = rn.toUpperCase(); // simple id, you can replace with UUID if desired
                Role r = Role.builder()
                    .pk("ROLE#" + id)
                    .sk("ROLE#" + id)
                    .roleId(id)
                    .roleName(rn)
                    .build();
                roleRepository.save(r);
            }
        }
    }
}
