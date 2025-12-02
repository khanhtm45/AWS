package com.leafshop.repository;

import com.leafshop.model.dynamodb.SizeTable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class SizeTableRepository {

    private final DynamoDbTable<SizeTable> sizeTable;

    @Autowired
    public SizeTableRepository(DynamoDbEnhancedClient enhancedClient) {
        this.sizeTable = enhancedClient.table("SizeTable", TableSchema.fromBean(SizeTable.class));
    }

    public SizeTable save(SizeTable size) {
        sizeTable.putItem(size);
        return size;
    }

    public List<SizeTable> saveAll(List<SizeTable> sizes) {
        for (SizeTable size : sizes) {
            sizeTable.putItem(size);
        }
        return sizes;
    }

    public Optional<SizeTable> findById(String sizeId) {
        Key key = Key.builder().partitionValue(sizeId).build();
        SizeTable size = sizeTable.getItem(key);
        return Optional.ofNullable(size);
    }

    public List<SizeTable> findAll() {
        return sizeTable.scan().items().stream().collect(Collectors.toList());
    }

    public List<SizeTable> findByIsActiveTrueOrderBySizeOrder() {
        return sizeTable.scan(ScanEnhancedRequest.builder().build())
                .items()
                .stream()
                .filter(size -> Boolean.TRUE.equals(size.getIsActive()))
                .sorted((s1, s2) -> Integer.compare(s1.getSizeOrder(), s2.getSizeOrder()))
                .collect(Collectors.toList());
    }

    public Optional<SizeTable> findBySizeNameAndIsActiveTrue(String sizeName) {
        return sizeTable.scan().items().stream()
                .filter(size -> sizeName.equals(size.getSizeName()) && Boolean.TRUE.equals(size.getIsActive()))
                .findFirst();
    }

    public long count() {
        return sizeTable.scan().items().stream().count();
    }

    public void deleteById(String sizeId) {
        Key key = Key.builder().partitionValue(sizeId).build();
        sizeTable.deleteItem(key);
    }
}