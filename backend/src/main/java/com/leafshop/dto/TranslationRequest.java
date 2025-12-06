package com.leafshop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslationRequest {
    private String text;
    private String sourceLanguage; // "vi", "en", "auto"
    private String targetLanguage; // "vi", "en"
}
