package com.server.repository;

import com.server.model.dynamodb.UserTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class UserTableRepository {

	private final DynamoDbEnhancedClient enhancedClient;

	private DynamoDbTable<UserTable> userTable() {
		return enhancedClient.table("UserTable", TableSchema.fromBean(UserTable.class));
	}

	public void save(UserTable user) {
		userTable().putItem(user);
	}

	// Find user by PK (USER#<user_id>)
	public List<UserTable> findByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).build();
		return userTable()
			.query(QueryConditional.keyEqualTo(key))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find user meta by PK and SK = "META"
	public Optional<UserTable> findByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(userTable().getItem(key));
	}

	// Find account by PK and SK = "ACCOUNT"
	public Optional<UserTable> findAccountByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).sortValue("ACCOUNT").build();
		return Optional.ofNullable(userTable().getItem(key));
	}

	// Find all addresses for a user
	public List<UserTable> findByPkAndSkStartingWith(String pk, String skPrefix) {
		return userTable()
			.query(QueryConditional.sortBeginsWith(
				Key.builder().partitionValue(pk).sortValue(skPrefix).build()))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find token by PK and SK = "TOKEN#<token_id>"
	public Optional<UserTable> findTokenByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(userTable().getItem(key));
	}

	// Find employee info by PK and SK = "EMPLOYEE#<employee_id>"
	public Optional<UserTable> findEmployeeByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(userTable().getItem(key));
	}
}
