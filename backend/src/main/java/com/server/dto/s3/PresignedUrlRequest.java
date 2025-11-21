package com.server.dto.s3;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PresignedUrlRequest {

	@NotBlank(message = "File name is required")
	private String fileName;

	private String folderPath; // Optional: ví dụ "products/images"

	private String contentType; // Optional: ví dụ "image/jpeg", "image/png"

	private Integer expirationMinutes = 5; // Default 5 phút
}

