package com.leafshop.aws;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.translate.TranslateClient;
import software.amazon.awssdk.services.translate.model.TranslateTextRequest;
import software.amazon.awssdk.services.translate.model.TranslateTextResponse;

@Service
public class TranslateService {

    private final TranslateClient translateClient;

    public TranslateService(TranslateClient translateClient) {
        this.translateClient = translateClient;
    }

    /**
     * Translate text using AWS Translate.
     * @param text source text
     * @param sourceLang source language code (e.g. "en")
     * @param targetLang target language code (e.g. "vi")
     * @return translated text
     */
    public String translateText(String text, String sourceLang, String targetLang) {
        TranslateTextRequest req = TranslateTextRequest.builder()
                .text(text)
                .sourceLanguageCode(sourceLang)
                .targetLanguageCode(targetLang)
                .build();

        TranslateTextResponse resp = translateClient.translateText(req);
        return resp.translatedText();
    }
}
