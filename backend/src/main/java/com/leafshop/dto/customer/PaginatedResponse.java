package com.leafshop.dto.customer;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PaginatedResponse<T> {
	List<T> content;
	int page;
	int size;
	long totalElements;
	int totalPages;
	boolean hasNext;
	boolean hasPrevious;
}


