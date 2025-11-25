package com.leafshop.repository;

import com.leafshop.model.dynamodb.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class RoleRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    private static final Logger log = LoggerFactory.getLogger(RoleRepository.class);

    private DynamoDbTable<Role> roleTable() {
        return enhancedClient.table("Roles", TableSchema.fromBean(Role.class));
    }

    public void save(Role role) {
        roleTable().putItem(role);
    }

    public Optional<Role> findByPk(String pk) {
        Key key = Key.builder().partitionValue(pk).build();
        return Optional.ofNullable(roleTable().getItem(key));
    }

    public Optional<Role> findByRoleId(String roleId) {
        // PK is expected to be ROLE#<roleId>
        String pk = "ROLE#" + roleId;
        return findByPk(pk);
    }

    public List<Role> scanAllRoles() {
        try {
            return roleTable()
                .scan(ScanEnhancedRequest.builder().build())
                .items()
                .stream()
                .collect(Collectors.toList());
        } catch (ResourceNotFoundException rnfe) {
            log.warn("DynamoDB table 'Roles' not found when scanning roles; returning empty list.", rnfe);
            return Collections.emptyList();
        } catch (DynamoDbException dde) {
            log.error("DynamoDB error while scanning Roles table; returning empty list.", dde);
            return Collections.emptyList();
        }
    }

    public Optional<Role> findByRoleName(String roleName) {
        return scanAllRoles()
            .stream()
            .filter(r -> r.getRoleName() != null && r.getRoleName().equalsIgnoreCase(roleName))
            .findFirst();
    }
}
