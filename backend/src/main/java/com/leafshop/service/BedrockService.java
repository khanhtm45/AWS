package com.leafshop.service;

import com.amazonaws.DefaultRequest;
import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.AWS4Signer;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.http.HttpMethodName;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service("bedrockServiceLegacy")
public class BedrockService {

    private final String region;
    private final String modelId;
    private final String endpointBase;

    public BedrockService(@Value("${aws.region:us-east-1}") String region,
                         @Value("${bedrock.model-id:anthropic.claude-v1}") String modelId) {
        this.region = region;
        this.modelId = modelId;
        this.endpointBase = "https://bedrock." + region + ".amazonaws.com";
    }

    public String invokeModel(String userMessage, String extraContext) throws Exception {
        String prompt = (extraContext == null ? "" : extraContext + "\n") + "User: " + userMessage + "\nAssistant:";

        String payload = String.format("{\"input\": \"%s\", \"temperature\": 0.7, \"max_tokens_to_sample\": 512}",
                escapeJson(prompt));

        String resourcePath = "/models/" + modelId + "/invoke";
        URI endpointUri = new URI(endpointBase);

        // Build AWS request for signing
        DefaultRequest<?> signableRequest = new DefaultRequest<>("bedrock");
        signableRequest.setHttpMethod(HttpMethodName.POST);
        signableRequest.setEndpoint(endpointUri);
        signableRequest.setResourcePath(resourcePath);
        signableRequest.setContent(new ByteArrayInputStream(payload.getBytes(StandardCharsets.UTF_8)));
        signableRequest.addHeader("Content-Type", "application/json");

        AWS4Signer signer = new AWS4Signer();
        signer.setServiceName("bedrock");
        signer.setRegionName(region);

        AWSCredentialsProvider credsProvider = new DefaultAWSCredentialsProviderChain();
        signer.sign(signableRequest, credsProvider.getCredentials());

        // Create HttpPost and copy signed headers
        HttpPost post = new HttpPost(endpointBase + resourcePath);
        for (Map.Entry<String, String> hdr : signableRequest.getHeaders().entrySet()) {
            post.addHeader(hdr.getKey(), hdr.getValue());
        }

        post.setEntity(new StringEntity(payload, StandardCharsets.UTF_8));

        try (CloseableHttpClient client = HttpClients.createDefault();
             CloseableHttpResponse resp = client.execute(post)) {
            HttpEntity entity = resp.getEntity();
            String body = entity != null ? EntityUtils.toString(entity, StandardCharsets.UTF_8) : "";
            return body;
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
