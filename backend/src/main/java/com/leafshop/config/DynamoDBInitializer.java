package com.leafshop.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeDefinition;
import software.amazon.awssdk.services.dynamodb.model.CreateTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;
import software.amazon.awssdk.services.dynamodb.model.KeySchemaElement;
import software.amazon.awssdk.services.dynamodb.model.KeyType;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;
import software.amazon.awssdk.services.dynamodb.model.ScalarAttributeType;
import software.amazon.awssdk.services.dynamodb.model.BillingMode;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.dynamodb.model.TableStatus;

import java.time.Duration;

@Component
@Order(0)
@ConditionalOnProperty(prefix = "aws.dynamodb", name = "auto-create", havingValue = "true", matchIfMissing = true)
public class DynamoDBInitializer implements CommandLineRunner {

    private final DynamoDbClient dynamoDbClient;

    // Master list of tables to ensure exist
    private static final String[] TABLES = new String[] {
        "BlogTable",
        "ChatTable",
        "CouponTable",
        "OrderTable",
        "PaymentTable",
        "ProductTable",
        "ReviewTable",
        "RevokedToken",
        "Roles",
        "UserTable",
        "WarehouseTable",
        "WishlistTable"
    };

    public DynamoDBInitializer(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @Override
    public void run(String... args) {
        try {
            for (String tableName : TABLES) {
                ensureTable(tableName);
            }
        } catch (SdkClientException sce) {
            System.out.println("Skipping DynamoDB table initialization due to SDK client error: " + sce.getMessage());
        }
    }

    private void ensureTable(String tableName) {
        try {
            DescribeTableResponse describeResponse = dynamoDbClient.describeTable(
                DescribeTableRequest.builder().tableName(tableName).build()
            );
            String status = describeResponse.table().tableStatusAsString();
            System.out.println("DynamoDB table '" + tableName + "' exists with status: " + status);
            return;
        } catch (ResourceNotFoundException rnfe) {
            System.out.println("DynamoDB table '" + tableName + "' not found, creating...");
        } catch (SdkClientException sce) {
            throw sce;
        } catch (DynamoDbException e) {
            System.out.println("Error describing DynamoDB table '" + tableName + "': " + e.getMessage());
            return;
        }

        CreateTableRequest createRequest = CreateTableRequest.builder()
            .tableName(tableName)
            .attributeDefinitions(
                AttributeDefinition.builder().attributeName("PK").attributeType(ScalarAttributeType.S).build(),
                AttributeDefinition.builder().attributeName("SK").attributeType(ScalarAttributeType.S).build()
            )
            .keySchema(
                KeySchemaElement.builder().attributeName("PK").keyType(KeyType.HASH).build(),
                KeySchemaElement.builder().attributeName("SK").keyType(KeyType.RANGE).build()
            )
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .build();

        try {
            dynamoDbClient.createTable(createRequest);
            System.out.println("Created DynamoDB table '" + tableName + "'. Waiting until ACTIVE...");

            waitForTableActive(tableName, Duration.ofSeconds(60));
        } catch (SdkClientException sce) {
            System.out.println("Skipping table creation for " + tableName + " because AWS SDK cannot load credentials or connect: " + sce.getMessage());
            return;
        } catch (DynamoDbException e) {
            System.out.println("Failed to create DynamoDB table '" + tableName + "': " + e.getMessage());
        }
    }

    private void waitForTableActive(String tableName, Duration timeout) {
        System.out.println("Waiting for table " + tableName + " to become ACTIVE...");
        long start = System.currentTimeMillis();
        long timeoutMs = timeout.toMillis();

        while (true) {
            try {
                Thread.sleep(1000);
                DescribeTableResponse response = dynamoDbClient.describeTable(
                    DescribeTableRequest.builder().tableName(tableName).build()
                );
                if (response.table().tableStatus() == TableStatus.ACTIVE) {
                    System.out.println("Table " + tableName + " is ACTIVE.");
                    break;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            } catch (ResourceNotFoundException ignored) {
            } catch (DynamoDbException e) {
                System.out.println("Error while waiting for table '" + tableName + "' to become ACTIVE: " + e.getMessage());
                break;
            }

            if (System.currentTimeMillis() - start > timeoutMs) {
                System.out.println("Timed out waiting for table '" + tableName + "' to become ACTIVE.");
                break;
            }
        }
    }
}
