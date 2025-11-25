package com.server.dto.s3;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresignedDownloadUrlResponse {

	private String presignedUrl;
	private String s3Key;
	private Integer expirationMinutes;
}


