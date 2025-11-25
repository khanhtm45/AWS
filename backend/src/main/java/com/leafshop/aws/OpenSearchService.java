package com.leafshop.aws;

import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.opensearch.client.opensearch.core.IndexResponse;
import org.opensearch.client.opensearch.core.SearchRequest;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
public class OpenSearchService {

    private final OpenSearchClient openSearchClient;

    public OpenSearchService(OpenSearchClient openSearchClient) {
        this.openSearchClient = openSearchClient;
    }

    public IndexResponse indexDocument(String index, String id, Map<String, Object> document) throws java.io.IOException {
        IndexRequest<Map<String, Object>> req = IndexRequest.of(i -> i.index(index).id(id).document(document));
        return openSearchClient.index(req);
    }

    public SearchResponse<Map> search(SearchRequest request) throws java.io.IOException {
        return openSearchClient.search(request, Map.class);
    }
}
