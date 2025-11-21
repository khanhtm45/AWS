package com.server.controller;

import com.server.dto.s3.PresignedUrlRequest;
import com.server.dto.s3.PresignedUrlResponse;
import com.server.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/s3")
@RequiredArgsConstructor
public class S3Controller {

	private final S3Service s3Service;

	/**
	 * Generate presigned URL để frontend upload trực tiếp lên S3
	 * 
	 * Flow:
	 * 1. Frontend gọi endpoint này để lấy presigned URL
	 * 2. Frontend upload file trực tiếp lên S3 bằng presigned URL
	 * 3. Frontend gọi API tạo ProductMedia với URL đã upload
	 */
	@PostMapping("/presigned-url")
	public ResponseEntity<PresignedUrlResponse> generatePresignedUrl(
		@Valid @RequestBody PresignedUrlRequest request
	) {
		// Tạo tên file unique nếu chưa có extension
		String fileName = request.getFileName();
		if (!fileName.contains(".")) {
			// Nếu không có extension, thử detect từ contentType hoặc dùng .jpg
			String extension = ".jpg";
			if (request.getContentType() != null) {
				if (request.getContentType().contains("png")) {
					extension = ".png";
				} else if (request.getContentType().contains("webp")) {
					extension = ".webp";
				} else if (request.getContentType().contains("gif")) {
					extension = ".gif";
				}
			}
			fileName = UUID.randomUUID().toString() + extension;
		} else {
			// Giữ extension nhưng thêm UUID prefix để tránh trùng
			String extension = fileName.substring(fileName.lastIndexOf("."));
			fileName = UUID.randomUUID().toString() + extension;
		}

		String folderPath = request.getFolderPath() != null 
			? request.getFolderPath() 
			: "products/images"; // Default folder

		String contentType = request.getContentType() != null 
			? request.getContentType() 
			: "image/jpeg"; // Default content type

		int expirationMinutes = request.getExpirationMinutes() != null 
			? request.getExpirationMinutes() 
			: 5;

		String presignedUrl = s3Service.generatePresignedUrl(fileName, folderPath, contentType, expirationMinutes);
		String s3Key = folderPath + "/" + fileName;
		String publicUrl = s3Service.getPublicUrl(s3Key);

		return ResponseEntity.ok(new PresignedUrlResponse(presignedUrl, s3Key, publicUrl));
	}

	/**
	 * Xóa file khỏi S3
	 */
	@DeleteMapping("/delete")
	public ResponseEntity<String> deleteFile(@RequestParam("s3Key") String s3Key) {
		try {
			s3Service.deleteFile(s3Key);
			return ResponseEntity.ok("File deleted successfully");
		} catch (Exception e) {
			return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
				.body("Error deleting file: " + e.getMessage());
		}
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}

