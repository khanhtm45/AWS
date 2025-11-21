package com.server.dto.s3;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUrlResponse {

	private String presignedUrl;
	private String s3Key; // Key để lưu vào database
	private String publicUrl; // URL công khai sau khi upload (nếu bucket public)
}

