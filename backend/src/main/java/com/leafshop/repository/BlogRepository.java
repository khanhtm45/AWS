package com.leafshop.repository;

import com.leafshop.model.dynamodb.BlogTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class BlogRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    // Lấy bảng BlogTable
    private DynamoDbTable<BlogTable> blogTable() {
        return enhancedClient.table("BlogTable", TableSchema.fromBean(BlogTable.class));
    }

    // Lưu hoặc cập nhật blog
    public void save(BlogTable blog) {
        blogTable().putItem(blog);
    }

    // Lấy blog theo PK
    public Optional<BlogTable> findByPk(String pk) {
        Key key = Key.builder().partitionValue(pk).build();
        return Optional.ofNullable(blogTable().getItem(key));
    }

    // Lấy blog theo PK + SK
    public Optional<BlogTable> findByPkAndSk(String pk, String sk) {
        Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
        return Optional.ofNullable(blogTable().getItem(key));
    }

    // Lấy danh sách theo filter (status, authorId, category, postType)
    private List<BlogTable> scanWithFilter(String expressionStr, Map<String, AttributeValue> eav) {
        Expression filterExpression = Expression.builder()
                .expression(expressionStr)
                .expressionValues(eav)
                .build();

        return blogTable()
                .scan(ScanEnhancedRequest.builder()
                        .filterExpression(filterExpression)
                        .build())
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    public List<BlogTable> findByStatus(String status) {
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":status", AttributeValue.builder().s(status).build());
        return scanWithFilter("status = :status", eav);
    }

    public List<BlogTable> findByAuthorId(String authorId) {
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":authorId", AttributeValue.builder().s(authorId).build());
        return scanWithFilter("authorId = :authorId", eav);
    }

    public List<BlogTable> findByCategory(String category) {
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":category", AttributeValue.builder().s(category).build());
        return scanWithFilter("category = :category", eav);
    }

    public List<BlogTable> findByPostType(String postType) {
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":postType", AttributeValue.builder().s(postType).build());
        return scanWithFilter("postType = :postType", eav);
    }

    public List<BlogTable> findByIsFeaturedTrue() {
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":true", AttributeValue.builder().bool(true).build());
        return scanWithFilter("isFeatured = :true", eav);
    }

    // Xóa blog theo PK + SK
    public void deleteByPkAndSk(String pk, String sk) {
        Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
        blogTable().deleteItem(key);
    }
}
