package com.server.config;


import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.List;

@Component
public class DynamoDBTableInitializer {

    private final DynamoDbClient dynamoDbClient;

    public DynamoDBTableInitializer(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @PostConstruct
    public void init() {
        createTableIfNotExist("UserTable", "PK", "SK");
        createTableIfNotExist("ProductTable", "PK", "SK");
        createTableIfNotExist("OrderTable", "PK", "SK");
        createTableIfNotExist("WarehouseTable", "PK", "SK");
        createTableIfNotExist("ReviewTable", "PK", "SK");
        createTableIfNotExist("BlogTable", "PK", "SK");
        createTableIfNotExist("CouponTable", "PK", "SK");
    }

    private void createTableIfNotExist(String tableName, String pkName, String skName) {
        try {
            dynamoDbClient.describeTable(b -> b.tableName(tableName));
            System.out.println("Table " + tableName + " already exists");
        } catch (ResourceNotFoundException e) {
            System.out.println("Creating table " + tableName);

            dynamoDbClient.createTable(b -> b
                    .tableName(tableName)
                    .keySchema(
                            KeySchemaElement.builder()
                                    .attributeName(pkName)
                                    .keyType(KeyType.HASH)
                                    .build(),
                            KeySchemaElement.builder()
                                    .attributeName(skName)
                                    .keyType(KeyType.RANGE)
                                    .build()
                    )
                    .attributeDefinitions(
                            AttributeDefinition.builder()
                                    .attributeName(pkName)
                                    .attributeType(ScalarAttributeType.S)
                                    .build(),
                            AttributeDefinition.builder()
                                    .attributeName(skName)
                                    .attributeType(ScalarAttributeType.S)
                                    .build()
                    )
                    .billingMode(BillingMode.PAY_PER_REQUEST) // tự động scale
            );

            waitForTableActive(tableName);
        }
    }

    private void waitForTableActive(String tableName) {
        System.out.println("Waiting for table " + tableName + " to become ACTIVE...");
        boolean active = false;
        while (!active) {
            try {
                Thread.sleep(1000);
                DescribeTableResponse response = dynamoDbClient.describeTable(b -> b.tableName(tableName));
                if (response.table().tableStatus() == TableStatus.ACTIVE) {
                    active = true;
                }
            } catch (InterruptedException ignored) {
            } catch (ResourceNotFoundException ignored) {
            }
        }
        System.out.println("Table " + tableName + " is ACTIVE.");
    }
}

