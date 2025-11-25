package com.leafshop.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

	private final AmazonS3 amazonS3;

	@Value("${aws.s3.bucket.name}")
	private String bucketName;

	/**
	 * Generate presigned URL để frontend upload trực tiếp lên S3
	 * @param fileName Tên file (có thể include extension)
	 * @param folderPath Đường dẫn folder trong S3 (ví dụ: "products/images")
	 * @param contentType Content-Type của file (ví dụ: "image/jpeg", "image/png")
	 * @param expirationMinutes Thời gian hết hạn (phút), default 5 phút
	 * @return Presigned URL
	 */
	public String generatePresignedUrl(String fileName, String folderPath, String contentType, int expirationMinutes) {
		// Tạo tên file unique nếu chưa có
		String s3Key;
		if (folderPath != null && !folderPath.isEmpty()) {
			s3Key = folderPath + "/" + fileName;
		} else {
			s3Key = fileName;
		}

		// Tạo presigned URL với expiration time
		Date expiration = new Date();
		long expTimeMillis = expiration.getTime();
		expTimeMillis += 1000L * 60 * expirationMinutes; // Convert minutes to milliseconds
		expiration.setTime(expTimeMillis);

		GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName, s3Key)
			.withMethod(HttpMethod.PUT)
			.withExpiration(expiration);

		// Set Content-Type nếu có
		if (contentType != null && !contentType.isEmpty()) {
			generatePresignedUrlRequest.setContentType(contentType);
		}

		URL url = amazonS3.generatePresignedUrl(generatePresignedUrlRequest);
		log.info("Generated presigned URL for: {} with Content-Type: {}", s3Key, contentType);
		return url.toString();
	}

	/**
	 * Generate presigned URL để frontend download file từ S3
	 * @param s3Key Key của file trong S3
	 * @param expirationMinutes Thời gian hết hạn (phút), default 5 phút
	 * @return Presigned URL
	 */
	public String generatePresignedDownloadUrl(String s3Key, int expirationMinutes) {
		Date expiration = new Date();
		long expTimeMillis = expiration.getTime();
		expTimeMillis += 1000L * 60 * expirationMinutes;
		expiration.setTime(expTimeMillis);

		GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName, s3Key)
			.withMethod(HttpMethod.GET)
			.withExpiration(expiration);

		URL url = amazonS3.generatePresignedUrl(generatePresignedUrlRequest);
		return url.toString();
	}

	/**
	 * Xóa file khỏi S3
	 * @param s3Key Key của file trong S3
	 */
	public void deleteFile(String s3Key) {
		amazonS3.deleteObject(bucketName, s3Key);
		log.info("File deleted from S3: {}", s3Key);
	}

	/**
	 * Lấy public URL của file (nếu bucket là public)
	 * @param s3Key Key của file trong S3
	 * @return Public URL
	 */
	public String getPublicUrl(String s3Key) {
		return amazonS3.getUrl(bucketName, s3Key).toString();
	}
}

