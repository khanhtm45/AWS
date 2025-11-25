package com.leafshop.component;

import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.service.DynamoDBService;
import com.leafshop.util.DynamoDBKeyUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;



@Component
@RequiredArgsConstructor
public class DynamoDBTestRunnerUser implements CommandLineRunner {

    private final DynamoDBService dynamoDBService;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("===== Running DynamoDB Test =====");
           String userId = "1";
    String pk = DynamoDBKeyUtil.userPk(userId); // Ví dụ: "USER#1"
    String sk = "META";
        // Tạo user test
        // UserTable user = UserTable.builder()
        //         .pk(DynamoDBKeyUtil.userPk("1"))
        //         .sk("META")
        //         .firstName("John")
        //         .lastName("Doe")
        //         .build();
  UserTable user = UserTable.builder()
            .pk(pk)
            .sk(sk)
            .firstName("John")
            .lastName("Doe")
            .build();
        System.out.println("Saving user with PK: " + user.getPk() + " | SK: " + user.getSk());
        dynamoDBService.saveUser(user);

        System.out.println("User saved: " + user.getFirstName() + " " + user.getLastName());

        try {
            UserTable fetched = dynamoDBService.getUser("1", "META");
            if (fetched != null) {
                System.out.println("User fetched: " + fetched.getFirstName() + " " + fetched.getLastName());
            } else {
                System.out.println("User not found!");
            }
        } catch (Exception e) {
            System.err.println("Error while testing DynamoDB user operations: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
}
