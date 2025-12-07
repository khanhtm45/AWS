package com.leafshop.aws;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.auth.AWS4Signer;
import org.apache.http.HttpHost;
// ...existing code...
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.translate.TranslateClient;

@Configuration
public class AwsClientConfig {

    @Value("${aws.s3.region:ap-southeast-2}")
    private String awsRegion;


    @Bean
    public TranslateClient translateClient() {
        return TranslateClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

}
