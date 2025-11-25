package com.leafshop.repository;

import com.leafshop.model.dynamodb.RevokedToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RevokedTokenRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    private DynamoDbTable<RevokedToken> table() {
        return enhancedClient.table("RevokedTokenTable", TableSchema.fromBean(RevokedToken.class));
    }

    public void save(String tokenValue, Long expiresAt) {
        String pk = "TOKEN#" + tokenValue;
        RevokedToken t = RevokedToken.builder().pk(pk).expiresAt(expiresAt).build();
        table().putItem(t);
    }

    public Optional<RevokedToken> findByTokenValue(String tokenValue) {
        String pk = "TOKEN#" + tokenValue;
        Key key = Key.builder().partitionValue(pk).build();
        return Optional.ofNullable(table().getItem(key));
    }
}
