package com.server.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {

	@Value("${aws.access.key.id:}")
	private String awsAccessKeyId;

	@Value("${aws.secret.access.key:}")
	private String awsSecretAccessKey;

	@Value("${aws.s3.region:ap-southeast-2}")
	private String awsRegion;

	@Bean
	public AmazonS3 amazonS3() {
		AmazonS3ClientBuilder builder = AmazonS3ClientBuilder.standard()
			.withRegion(awsRegion);

		// Nếu có credentials, set credentials
		if (awsAccessKeyId != null && !awsAccessKeyId.isEmpty()
			&& awsSecretAccessKey != null && !awsSecretAccessKey.isEmpty()) {
			BasicAWSCredentials awsCredentials = new BasicAWSCredentials(awsAccessKeyId, awsSecretAccessKey);
			builder.withCredentials(new AWSStaticCredentialsProvider(awsCredentials));
		}

		return builder.build();
	}
}

