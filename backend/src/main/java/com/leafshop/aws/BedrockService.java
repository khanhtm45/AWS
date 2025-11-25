package com.leafshop.aws;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.auth.AWS4Signer;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Service
public class BedrockService {

    @Value("${bedrock.endpoint:}")
    private String bedrockEndpoint;

    @Value("${aws.s3.region:ap-southeast-2}")
    private String awsRegion;

    /**
     * Invoke an already-deployed Bedrock model via HTTP POST.
     * The caller should provide the full invoke URL (for example: https://bedrock-.../models/{modelId}/invoke)
     * or set `bedrock.endpoint` and pass the path.
     */
    public String invoke(String invokeUrl, String jsonPayload) throws Exception {
        if ((bedrockEndpoint == null || bedrockEndpoint.isBlank()) && (invokeUrl == null || invokeUrl.isBlank())) {
            throw new IllegalStateException("bedrock.endpoint or invokeUrl must be provided");
        }

        String url = (invokeUrl != null && !invokeUrl.isBlank()) ? invokeUrl : bedrockEndpoint;

        // Use AWS v1 signer + interceptor for signing requests to "bedrock" service (if available)
        AWS4Signer signer = new AWS4Signer();
        signer.setServiceName("bedrock");
        signer.setRegionName(awsRegion);
        AWSCredentialsProvider credsProvider = new DefaultAWSCredentialsProviderChain();

        org.apache.http.HttpRequestInterceptor interceptor = tryCreateAwsSigningInterceptor("bedrock", signer, credsProvider);

        CloseableHttpClient httpClient;
        if (interceptor != null) {
            httpClient = HttpClients.custom().addInterceptorLast(interceptor).build();
        } else {
            // Fall back to unsigned client (will fail against AWS Bedrock but works for local/mocked endpoints)
            System.err.println("Warning: AWSRequestSigningApacheInterceptor not found. Bedrock requests will NOT be signed.");
            httpClient = HttpClients.createDefault();
        }

        try (CloseableHttpClient c = httpClient) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(jsonPayload, StandardCharsets.UTF_8));

            try (CloseableHttpResponse resp = httpClient.execute(post)) {
                BufferedReader br = new BufferedReader(new InputStreamReader(resp.getEntity().getContent(), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append('\n');
                }
                return sb.toString();
            }
        }
    }

    private org.apache.http.HttpRequestInterceptor tryCreateAwsSigningInterceptor(String serviceName, AWS4Signer signer, AWSCredentialsProvider credsProvider) {
        try {
            Class<?> clazz = Class.forName("com.amazonaws.http.AWSRequestSigningApacheInterceptor");
            java.lang.reflect.Constructor<?> ctor = clazz.getConstructor(String.class, AWS4Signer.class, AWSCredentialsProvider.class);
            Object instance = ctor.newInstance(serviceName, signer, credsProvider);
            return (org.apache.http.HttpRequestInterceptor) instance;
        } catch (Throwable t) {
            return null;
        }
    }
}
