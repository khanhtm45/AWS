package com.leafshop.aws;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import software.amazon.awssdk.services.translate.TranslateClient;
import software.amazon.awssdk.services.translate.model.TranslateTextRequest;
import software.amazon.awssdk.services.translate.model.TranslateTextResponse;

public class TranslateServiceTest {

    @Test
    public void translateText_returnsTranslatedText() {
        TranslateClient mockClient = Mockito.mock(TranslateClient.class);
        TranslateService service = new TranslateService(mockClient);

        TranslateTextResponse resp = TranslateTextResponse.builder().translatedText("xin chao").build();
        Mockito.when(mockClient.translateText(Mockito.any(TranslateTextRequest.class))).thenReturn(resp);

        String out = service.translateText("hello", "en", "vi");
        Assertions.assertEquals("xin chao", out);
    }
}
