package com.leafshop.aws;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.IndexResponse;

import java.util.Map;

public class OpenSearchServiceTest {

    @Test
    public void indexDocument_callsClientAndReturnsResponse() throws Exception {
        OpenSearchClient mockClient = Mockito.mock(OpenSearchClient.class);
        OpenSearchService service = new OpenSearchService(mockClient);

        IndexResponse mockResp = Mockito.mock(IndexResponse.class);
        Mockito.when(mockClient.index(Mockito.<org.opensearch.client.opensearch.core.IndexRequest<Map<String, Object>>>any())).thenReturn(mockResp);

        Map<String, Object> doc = Map.of("title", "hello");
        IndexResponse resp = service.indexDocument("test-index", "1", doc);

        Assertions.assertSame(mockResp, resp);
        Mockito.verify(mockClient).index(Mockito.<org.opensearch.client.opensearch.core.IndexRequest<Map<String, Object>>>any());
    }
}
