package com.leafshop.repository;

import com.leafshop.model.dynamodb.UserTable;
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
import java.util.Map;
import java.util.HashMap;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

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

	public void delete(UserTable user) {
		userTable().deleteItem(user);
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

	// Find token by PK, token value and token type (scan)
	public Optional<UserTable> findTokenByPkValueAndType(String pk, String tokenValue, String tokenType) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":pk", AttributeValue.builder().s(pk).build());
		eav.put(":tval", AttributeValue.builder().s(tokenValue).build());
		eav.put(":ttype", AttributeValue.builder().s(tokenType).build());

		Expression filterExpression = Expression.builder()
			.expression("PK = :pk AND tokenValue = :tval AND tokenType = :ttype")
			.expressionValues(eav)
			.build();

		return userTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).limit(1).build())
			.items()
			.stream()
			.findFirst();
	}

	// Find token by tokenValue and tokenType across all PKs (scan)
	public Optional<UserTable> findTokenByValueAndType(String tokenValue, String tokenType) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":tval", AttributeValue.builder().s(tokenValue).build());
		eav.put(":ttype", AttributeValue.builder().s(tokenType).build());

		Expression filterExpression = Expression.builder()
			.expression("tokenValue = :tval AND tokenType = :ttype")
			.expressionValues(eav)
			.build();

		return userTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).limit(1).build())
			.items()
			.stream()
			.findFirst();
	}

	// Find employee info by PK and SK = "EMPLOYEE#<employee_id>"
	public Optional<UserTable> findEmployeeByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(userTable().getItem(key));
	}

	// Scan for all user META records (PK starts with USER# and SK = META)
	public List<UserTable> scanAllUsersMeta() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":prefix", AttributeValue.builder().s("USER#").build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("begins_with(PK, :prefix) AND SK = :meta")
			.expressionValues(eav)
			.build();

		return userTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Scan for all EMPLOYEE items
	public List<UserTable> scanAllEmployees() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":etype", AttributeValue.builder().s("EMPLOYEE").build());

		Expression filterExpression = Expression.builder()
			.expression("itemType = :etype")
			.expressionValues(eav)
			.build();

		return userTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find account by username (scan)
	public Optional<UserTable> findAccountByUsername(String username) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":username", AttributeValue.builder().s(username).build());
		eav.put(":account", AttributeValue.builder().s("ACCOUNT").build());

		Expression filterExpression = Expression.builder()
			.expression("SK = :account AND username = :username")
			.expressionValues(eav)
			.build();

		return userTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).limit(1).build())
			.items()
			.stream()
			.findFirst();
	}

	// Find account by email (scan)
	public Optional<UserTable> findAccountByEmail(String email) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":email", AttributeValue.builder().s(email).build());
		eav.put(":account", AttributeValue.builder().s("ACCOUNT").build());

		Expression filterExpression = Expression.builder()
			.expression("SK = :account AND email = :email")
			.expressionValues(eav)
			.build();

		return userTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).limit(1).build())
			.items()
			.stream()
			.findFirst();
	}
}
