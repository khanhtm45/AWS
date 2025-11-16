package com.server.dto.review;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApproveReviewRequest {

	@NotNull
	private Boolean isApproved;
}

