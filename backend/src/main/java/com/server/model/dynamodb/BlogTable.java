package com.server.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class BlogTable {

    private String pk; // POST#<post_id>
    private String sk; // META

    private String itemType;
    private String postId;
    private String title;
    private String content;
    private String excerpt;
    private String authorId;
    private String authorName;
    private String postType; // BLOG, NEWS, GUIDE, TUTORIAL
    private String category;
    private List<String> tags;
    private String featuredImage;
    private List<String> images;
    private String status; // DRAFT, PUBLISHED, ARCHIVED
    private Long publishedAt;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isFeatured;
    private String seoTitle;
    private String seoDescription;
    private List<String> seoKeywords;
    private Long createdAt;
    private Long updatedAt;

    // 🔹 Enhanced DynamoDB annotations must be on getters
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
}
