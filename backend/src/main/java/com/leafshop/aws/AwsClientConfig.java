package com.leafshop.aws;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.auth.AWS4Signer;
import org.apache.http.HttpHost;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.RestClient;
import org.opensearch.client.RestClientBuilder;
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

    @Value("${opensearch.endpoint:}")
    private String opensearchEndpoint;

    @Value("${opensearch.signing.enabled:true}")
    private boolean opensearchSigningEnabled;

    @Bean
    public TranslateClient translateClient() {
        return TranslateClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Bean
    public OpenSearchClient openSearchClient() {
        if (opensearchEndpoint == null || opensearchEndpoint.isBlank()) {
            throw new IllegalStateException("Property 'opensearch.endpoint' must be set to create OpenSearch client");
        }
        // If signing disabled or endpoint uses plain http (local OpenSearch), do not attach SigV4 interceptor
        RestClientBuilder builder = RestClient.builder(HttpHost.create(opensearchEndpoint));
        boolean useSigning = opensearchSigningEnabled && opensearchEndpoint.toLowerCase().startsWith("https");
        if (useSigning) {
            // Use AWS v1 signer + interceptor to sign requests for OpenSearch (service name: "es")
            AWS4Signer signer = new AWS4Signer();
            signer.setServiceName("es");
            signer.setRegionName(awsRegion);
            AWSCredentialsProvider awsCredentialsProvider = new DefaultAWSCredentialsProviderChain();

            // Create AWSRequestSigningApacheInterceptor via reflection if available
            org.apache.http.HttpRequestInterceptor interceptor = tryCreateAwsSigningInterceptor("es", signer, awsCredentialsProvider);
            if (interceptor != null) {
                builder = builder.setHttpClientConfigCallback(hc -> {
                    hc.addInterceptorLast(interceptor);
                    return hc;
                });
            } else {
                // If interceptor class not present, skip attaching it and warn (unsigned requests will fail for AWS OpenSearch)
                System.err.println("Warning: AWSRequestSigningApacheInterceptor class not found on classpath. OpenSearch requests will NOT be signed.");
            }
        }

        RestClient lowLevelRestClient = builder.build();
        OpenSearchTransport transport = new RestClientTransport(lowLevelRestClient, new JacksonJsonpMapper());
        return new OpenSearchClient(transport);
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
