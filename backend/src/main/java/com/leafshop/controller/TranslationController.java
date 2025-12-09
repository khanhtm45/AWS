package com.leafshop.controller;

import com.leafshop.dto.TranslationRequest;
import com.leafshop.dto.TranslationResponse;
import com.leafshop.service.TranslationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/translate")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Translation", description = "AWS Translate API for language translation")
public class TranslationController {

    private final TranslationService translationService;

    @PostMapping
    @Operation(summary = "Translate text", description = "Translate text from source language to target language")
    public ResponseEntity<TranslationResponse> translateText(@RequestBody TranslationRequest request) {
        try {
            log.info("Translation request: {} -> {}, text length: {}",
                    request.getSourceLanguage(),
                    request.getTargetLanguage(),
                    request.getText().length());

            String translatedText = translationService.translateText(
                    request.getText(),
                    request.getSourceLanguage(),
                    request.getTargetLanguage()
            );

            TranslationResponse response = new TranslationResponse(
                    translatedText,
                    request.getSourceLanguage(),
                    request.getTargetLanguage(),
                    request.getText()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Translation error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/vi-to-en")
    @Operation(summary = "Translate Vietnamese to English")
    public ResponseEntity<TranslationResponse> translateViToEn(@RequestBody String text) {
        try {
            String translatedText = translationService.translateViToEn(text);
            TranslationResponse response = new TranslationResponse(
                    translatedText, "vi", "en", text
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Translation error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/en-to-vi")
    @Operation(summary = "Translate English to Vietnamese")
    public ResponseEntity<TranslationResponse> translateEnToVi(@RequestBody String text) {
        try {
            String translatedText = translationService.translateEnToVi(text);
            TranslationResponse response = new TranslationResponse(
                    translatedText, "en", "vi", text
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Translation error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/auto-detect")
    @Operation(summary = "Translate with auto-detect source language")
    public ResponseEntity<TranslationResponse> translateAutoDetect(
            @RequestBody TranslationRequest request) {
        try {
            String translatedText = translationService.translateTextAutoDetect(
                    request.getText(),
                    request.getTargetLanguage()
            );

            TranslationResponse response = new TranslationResponse(
                    translatedText,
                    "auto",
                    request.getTargetLanguage(),
                    request.getText()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Translation error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Check translation service health")
    public ResponseEntity<String> healthCheck() {
        if (translationService.isInitialized()) {
            return ResponseEntity.ok("Translation service is running");
        } else {
            return ResponseEntity.status(503).body("Translation service is not initialized");
        }
    }
}
