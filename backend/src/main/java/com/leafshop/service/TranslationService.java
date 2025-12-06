package com.leafshop.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.translate.TranslateClient;
import software.amazon.awssdk.services.translate.model.TranslateTextRequest;
import software.amazon.awssdk.services.translate.model.TranslateTextResponse;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
@Slf4j
public class TranslationService {

    @Value("${aws.access.key.id:}")
    private String awsAccessKeyId;

    @Value("${aws.secret.access.key:}")
    private String awsSecretKey;

    @Value("${aws.translate.region:ap-southeast-1}")
    private String awsRegion;

    @Value("${aws.translate.enabled:true}")
    private boolean translateEnabled;

    private TranslateClient translateClient;

    @PostConstruct
    public void init() {
        if (!translateEnabled) {
            log.warn("AWS Translate is disabled. Set aws.translate.enabled=true to enable.");
            return;
        }

        if (awsAccessKeyId == null || awsAccessKeyId.isEmpty() || 
            awsSecretKey == null || awsSecretKey.isEmpty()) {
            log.warn("AWS credentials not configured. Translation service will be disabled. " +
                    "Please configure aws.access.key.id and aws.secret.access.key in application.properties");
            translateEnabled = false;
            return;
        }

        try {
            AwsCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(awsAccessKeyId, awsSecretKey)
            );

            translateClient = TranslateClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            log.info("AWS Translate client initialized successfully in region: {}", awsRegion);
        } catch (Exception e) {
            log.error("Failed to initialize AWS Translate client: {}", e.getMessage(), e);
            log.warn("Translation service will be disabled due to initialization error.");
            translateEnabled = false;
            translateClient = null;
        }
    }

    @PreDestroy
    public void cleanup() {
        if (translateClient != null) {
            translateClient.close();
            log.info("AWS Translate client closed");
        }
    }

    /**
     * Translate text from source language to target language
     * 
     * @param text           Text to translate
     * @param sourceLanguage Source language code (e.g., "vi", "en", "auto")
     * @param targetLanguage Target language code (e.g., "vi", "en")
     * @return Translated text
     */
    public String translateText(String text, String sourceLanguage, String targetLanguage) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        if (!translateEnabled || translateClient == null) {
            log.debug("Translation service is not available, returning original text");
            return text;
        }

        try {
            TranslateTextRequest request = TranslateTextRequest.builder()
                    .text(text)
                    .sourceLanguageCode(sourceLanguage)
                    .targetLanguageCode(targetLanguage)
                    .build();

            TranslateTextResponse response = translateClient.translateText(request);
            String translatedText = response.translatedText();

            log.info("Translated text from {} to {}: '{}' -> '{}'", 
                    sourceLanguage, targetLanguage, 
                    text.substring(0, Math.min(50, text.length())), 
                    translatedText.substring(0, Math.min(50, translatedText.length())));

            return translatedText;
        } catch (Exception e) {
            log.error("Translation failed from {} to {}: {}", 
                    sourceLanguage, targetLanguage, e.getMessage(), e);
            throw new RuntimeException("Translation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Translate text with auto-detect source language
     * 
     * @param text           Text to translate
     * @param targetLanguage Target language code
     * @return Translated text
     */
    public String translateTextAutoDetect(String text, String targetLanguage) {
        return translateText(text, "auto", targetLanguage);
    }

    /**
     * Translate Vietnamese to English
     * 
     * @param text Vietnamese text
     * @return English text
     */
    public String translateViToEn(String text) {
        return translateText(text, "vi", "en");
    }

    /**
     * Translate English to Vietnamese
     * 
     * @param text English text
     * @return Vietnamese text
     */
    public String translateEnToVi(String text) {
        return translateText(text, "en", "vi");
    }

    /**
     * Check if Translate client is initialized
     * 
     * @return true if initialized, false otherwise
     */
    public boolean isInitialized() {
        return translateEnabled && translateClient != null;
    }
}
